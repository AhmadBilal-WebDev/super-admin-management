import Cart from "../../../../models/restaurantModels/cart.js";
import formatCart, {
    formatCartItem,
} from "../../../../utils/restaurantUtils/formatCart.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";
import {
    buildValidatedCartItems,
    recalculateCartTotals,
    roundMoney,
} from "../../../../utils/restaurantUtils/cartLineBuilder.js";
import { isDeliveryInsideBranchServiceArea } from "../../../../utils/restaurantUtils/serviceAreaGeo.js";

const ORDER_MODES = ["delivery", "pickup", "dine_in"];
const PAYMENT_METHODS = ["cod", "card", "wallet", "other"];

const formatBranchForCheckout = (branch) => ({
    id: branch._id,
    name: branch.name || "",
    branchCode: branch.branchCode || "",
    address: branch.address || "",
    city: branch.city || "",
    district: branch.district || "",
    province: branch.province || "",
    country: branch.country || "",
    postalCode: branch.postalCode || "",
    contactNumber: branch.contactNumber || "",
    email: branch.email || "",
    openingTime: branch.openingTime || "",
    closingTime: branch.closingTime || "",
    // Restaurant / branch map pin
    latitude: branch.latitude || "",
    longitude: branch.longitude || "",
    serviceRadiusKm: branch.serviceRadiusKm ?? null,
    hasServicePolygon: Array.isArray(branch.servicePolygon)
        ? branch.servicePolygon.length >= 4
        : false,
    isActive: branch.isActive !== false,
});

/**
 * Checkout = save full cart + delivery/pickup/COD + location details.
 * Next step: POST /orders with useCheckout: true
 */
const checkout = async (req, res) => {
    try {
        const merchant = req.merchant;
        const customer = req.customer;
        const frontendDomainUrl =
            getFrontendDomainFromRequest(req) || merchant.frontendDomainUrl;

        const domainCheck = assertOwnerDomain(merchant, frontendDomainUrl);

        if (domainCheck.error) {
            return res.status(domainCheck.error.status).json({
                success: false,
                message: domainCheck.error.message,
            });
        }

        const {
            branchId,
            branchName,
            latitude,
            longitude,
            orderMode,
            selectedArea,
            deliveryAddress,
            notes,
            paymentMethod,
            deliveryFee,
            customerName,
            customerContact,
        } = req.body || {};

        const cart = await Cart.findOne({
            merchantId: merchant._id,
            customerId: customer._id,
        });

        if (!cart || !Array.isArray(cart.items) || !cart.items.length) {
            return res.status(400).json({
                success: false,
                message:
                    "Cart is empty. Add items to cart first, then checkout",
            });
        }

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "latitude and longitude are required for checkout",
            });
        }

        const normalizedMode = String(orderMode || "delivery")
            .trim()
            .toLowerCase();

        if (!ORDER_MODES.includes(normalizedMode)) {
            return res.status(400).json({
                success: false,
                message: "orderMode must be delivery, pickup, or dine_in",
            });
        }

        const normalizedPayment = String(paymentMethod || "cod")
            .trim()
            .toLowerCase();

        if (!PAYMENT_METHODS.includes(normalizedPayment)) {
            return res.status(400).json({
                success: false,
                message: "paymentMethod must be cod, card, wallet, or other",
            });
        }

        const area = String(selectedArea || "").trim();
        if (normalizedMode === "delivery" && !area) {
            return res.status(400).json({
                success: false,
                message: "selectedArea is required for delivery checkout",
            });
        }

        if (
            normalizedMode === "delivery" &&
            !String(deliveryAddress || "").trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "deliveryAddress is required for delivery checkout",
            });
        }

        const sourceItems = cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variantId: item.variantId || item.variant?.variantId,
            addons: item.addons,
            notes: item.notes,
        }));

        const validated = await buildValidatedCartItems({
            merchant,
            branchId: branchId || cart.branchId,
            branchName: branchName || cart.branchName,
            items: sourceItems,
        });

        if (validated.error) {
            return res.status(validated.error.status).json({
                success: false,
                message: validated.error.message,
            });
        }

        const branch = validated.branch;
        let coverage = { ok: true, reason: "Not required for this order mode" };

        if (normalizedMode === "delivery") {
            coverage = isDeliveryInsideBranchServiceArea(
                branch,
                latitude,
                longitude
            );

            if (!coverage.ok) {
                return res.status(400).json({
                    success: false,
                    message: coverage.reason,
                    checkoutAllowed: false,
                    branch: formatBranchForCheckout(branch),
                    customerLocation: {
                        latitude: String(latitude).trim(),
                        longitude: String(longitude).trim(),
                    },
                });
            }
        }

        const totals = recalculateCartTotals(validated.items);
        const fee =
            normalizedMode === "delivery"
                ? roundMoney(Number(deliveryFee) || 0)
                : 0;
        const discountTotal = 0;
        const itemsSubtotal = totals.subtotal;
        const taxTotal = totals.taxTotal;
        const checkoutGrandTotal = roundMoney(
            itemsSubtotal + taxTotal + fee - discountTotal
        );

        const formattedItems = validated.items.map(formatCartItem);
        const preparedAt = new Date();

        cart.branchId = branch._id;
        cart.branchName = branch.name;
        cart.items = validated.items;
        cart.itemsCount = totals.itemsCount;
        cart.subtotal = itemsSubtotal;
        cart.taxTotal = taxTotal;
        cart.grandTotal = totals.grandTotal;
        cart.currency = merchant.currency || "PKR";
        cart.checkout = {
            isReady: true,
            orderMode: normalizedMode,
            paymentMethod: normalizedPayment,
            selectedArea: area,
            latitude: String(latitude).trim(),
            longitude: String(longitude).trim(),
            deliveryAddress: String(deliveryAddress || "").trim(),
            deliveryFee: fee,
            discountTotal,
            checkoutGrandTotal,
            notes: String(notes || "").trim(),
            preparedAt,
        };

        await cart.save();

        const customerPayload = {
            id: customer._id,
            name: String(customerName || customer.name || "").trim(),
            email: customer.email || "",
            countryCode: customer.countryCode || "",
            contactNumber: String(
                customerContact || customer.contactNumber || ""
            ).trim(),
            gender: customer.gender || "",
        };

        const fulfillment = {
            orderMode: normalizedMode,
            isDelivery: normalizedMode === "delivery",
            isPickup: normalizedMode === "pickup",
            isDineIn: normalizedMode === "dine_in",
            paymentMethod: normalizedPayment,
            isCOD: normalizedPayment === "cod",
            selectedArea: area,
            deliveryAddress: String(deliveryAddress || "").trim(),
            notes: String(notes || "").trim(),
            customerLocation: {
                latitude: String(latitude).trim(),
                longitude: String(longitude).trim(),
            },
            branchLocation: {
                latitude: branch.latitude || "",
                longitude: branch.longitude || "",
                address: branch.address || "",
            },
            serviceCoverage: {
                checked: normalizedMode === "delivery",
                insideServiceArea: coverage.ok === true,
                message: coverage.reason || "OK",
            },
        };

        const priceSummary = {
            currency: merchant.currency || "PKR",
            uniqueItemsCount: validated.items.length,
            itemsCount: totals.itemsCount,
            itemsSubtotal,
            taxTotal,
            deliveryFee: fee,
            discountTotal,
            grandTotal: checkoutGrandTotal,
            breakdown: {
                itemsSubtotal,
                taxTotal,
                deliveryFee: fee,
                discountTotal,
                payable: checkoutGrandTotal,
            },
        };

        const placeOrderPayload = {
            frontendDomainUrl,
            useCheckout: true,
        };

        return res.status(200).json({
            success: true,
            message:
                "Checkout saved successfully. Review details below, then POST /orders with useCheckout:true",
            checkoutAllowed: true,
            nextStep: "place-order",
            nextApi: "POST /api/restaurant/user/orders",
            merchant: {
                id: merchant._id,
                name: merchant.restaurantName || merchant.name || "",
                currency: merchant.currency || "PKR",
                frontendDomainUrl,
            },
            customer: customerPayload,
            branch: formatBranchForCheckout(branch),
            fulfillment,
            items: formattedItems,
            priceSummary,
            checkout: {
                isReady: true,
                preparedAt,
                orderMode: normalizedMode,
                paymentMethod: normalizedPayment,
                selectedArea: area,
                deliveryAddress: String(deliveryAddress || "").trim(),
                latitude: String(latitude).trim(),
                longitude: String(longitude).trim(),
                notes: String(notes || "").trim(),
                uniqueItemsCount: validated.items.length,
                itemsCount: totals.itemsCount,
                items: formattedItems,
                priceSummary,
                branch: formatBranchForCheckout(branch),
                customer: customerPayload,
                fulfillment,
            },
            cart: formatCart(cart),
            placeOrderPayload,
            // Ready-to-copy test body for next API
            testPlaceOrderBody: {
                useCheckout: true,
            },
        });
    } catch (error) {
        console.error("Checkout error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to prepare checkout",
        });
    }
};

export default checkout;
