import Cart from "../../../../models/restaurantModels/cart.js";
import formatCart from "../../../../utils/restaurantUtils/formatCart.js";
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

/**
 * Checkout preview BEFORE placing order.
 * - Requires login
 * - Uses server cart (after sync) OR optional body.items from localStorage
 * - Validates products + delivery area
 * - Returns ready payload for POST /orders
 */
const checkout = async (req, res) => {
    try {
        const merchant = req.merchant;
        const customer = req.customer;

        const domainCheck = assertOwnerDomain(
            merchant,
            getFrontendDomainFromRequest(req)
        );

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
            items: bodyItems,
        } = req.body || {};

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

        const area = String(selectedArea || "").trim();
        if (normalizedMode === "delivery" && !area) {
            return res.status(400).json({
                success: false,
                message: "selectedArea is required for delivery checkout",
            });
        }

        let cart = await Cart.findOne({
            merchantId: merchant._id,
            customerId: customer._id,
        });

        const sourceItems =
            Array.isArray(bodyItems) && bodyItems.length
                ? bodyItems
                : (cart?.items || []).map((item) => ({
                      productId: item.productId,
                      quantity: item.quantity,
                      variantId: item.variantId || item.variant?.variantId,
                      addons: item.addons,
                      notes: item.notes,
                  }));

        if (!sourceItems.length) {
            return res.status(400).json({
                success: false,
                message:
                    "Cart is empty. Add items first (localStorage or server cart)",
            });
        }

        const validated = await buildValidatedCartItems({
            merchant,
            branchId: branchId || cart?.branchId,
            branchName: branchName || cart?.branchName,
            items: sourceItems,
        });

        if (validated.error) {
            return res.status(validated.error.status).json({
                success: false,
                message: validated.error.message,
            });
        }

        const branch = validated.branch;

        if (normalizedMode === "delivery") {
            const coverage = isDeliveryInsideBranchServiceArea(
                branch,
                latitude,
                longitude
            );

            if (!coverage.ok) {
                return res.status(400).json({
                    success: false,
                    message: coverage.reason,
                    checkoutAllowed: false,
                });
            }
        }

        // Keep server cart refreshed with validated items
        if (!cart) {
            cart = new Cart({
                merchantId: merchant._id,
                bussinessId: merchant.bussinessId,
                customerId: customer._id,
                currency: merchant.currency || "PKR",
            });
        }

        const totals = recalculateCartTotals(validated.items);
        cart.branchId = branch._id;
        cart.branchName = branch.name;
        cart.items = validated.items;
        cart.itemsCount = totals.itemsCount;
        cart.subtotal = totals.subtotal;
        cart.taxTotal = totals.taxTotal;
        cart.grandTotal = totals.grandTotal;
        cart.currency = merchant.currency || "PKR";
        await cart.save();

        const fee =
            normalizedMode === "delivery"
                ? roundMoney(Number(deliveryFee) || 0)
                : 0;

        const checkoutGrandTotal = roundMoney(
            totals.subtotal + totals.taxTotal + fee
        );

        const orderPayload = {
            frontendDomainUrl:
                getFrontendDomainFromRequest(req) || merchant.frontendDomainUrl,
            branchId: branch._id,
            branchName: branch.name,
            latitude: String(latitude).trim(),
            longitude: String(longitude).trim(),
            orderMode: normalizedMode,
            selectedArea: area,
            deliveryAddress: String(deliveryAddress || "").trim(),
            notes: String(notes || "").trim(),
            paymentMethod: String(paymentMethod || "cod").trim().toLowerCase(),
            deliveryFee: fee,
            items: validated.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                variantId: item.variantId || item.variant?.variantId || undefined,
                addons: (item.addons || []).map((addon) => ({
                    addonId: addon.addonId,
                    quantity: addon.quantity,
                })),
                notes: item.notes || "",
            })),
        };

        return res.status(200).json({
            success: true,
            message: "Checkout ready. Login verified. You can place order now",
            checkoutAllowed: true,
            requiresLogin: false,
            cart: formatCart(cart),
            checkout: {
                branchId: branch._id,
                branchName: branch.name,
                orderMode: normalizedMode,
                selectedArea: area,
                latitude: String(latitude).trim(),
                longitude: String(longitude).trim(),
                deliveryAddress: String(deliveryAddress || "").trim(),
                itemsCount: totals.itemsCount,
                subtotal: totals.subtotal,
                taxTotal: totals.taxTotal,
                deliveryFee: fee,
                grandTotal: checkoutGrandTotal,
                currency: merchant.currency || "PKR",
                customer: {
                    id: customer._id,
                    name: customer.name,
                    email: customer.email,
                    contactNumber: customer.contactNumber,
                    gender: customer.gender || "",
                },
                items: validated.items,
            },
            // Frontend can send this directly to POST /orders
            placeOrderPayload: orderPayload,
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
