import mongoose from "mongoose";
import Order from "../../../../models/restaurantModels/order.js";
import Product from "../../../../models/restaurantModels/product.js";
import formatOrder from "../../../../utils/restaurantUtils/formatOrder.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";
import {
    resolveBranchForMerchant,
    buildBranchVisibilityFilter,
} from "../../../../utils/restaurantUtils/catalogScope.js";
import { isDeliveryInsideBranchServiceArea } from "../../../../utils/restaurantUtils/serviceAreaGeo.js";

const ORDER_MODES = ["delivery", "pickup", "dine_in"];
const PAYMENT_METHODS = ["cod", "card", "wallet", "other"];

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const generateOrderNumber = () => {
    const stamp = Date.now().toString().slice(-8);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${stamp}-${rand}`;
};

const productAvailableForBranch = (product, branch) => {
    if (product.showAllBranches === true) return true;
    if (product.branchId && String(product.branchId) === String(branch._id)) {
        return true;
    }
    const names = Array.isArray(product.branchName) ? product.branchName : [];
    return names.some(
        (name) =>
            String(name || "").trim().toLowerCase() ===
            String(branch.name || "").trim().toLowerCase()
    );
};

const resolveUnitPrice = (product, variant) => {
    if (variant) {
        if (
            variant.discountPrice !== undefined &&
            variant.discountPrice !== null &&
            Number(variant.discountPrice) >= 0
        ) {
            return Number(variant.discountPrice);
        }
        return Number(variant.price) || 0;
    }

    if (
        product.discountPrice !== undefined &&
        product.discountPrice !== null &&
        Number(product.discountPrice) >= 0
    ) {
        return Number(product.discountPrice);
    }

    return Number(product.price) || 0;
};

const placeOrder = async (req, res) => {
    try {
        const customer = req.customer;
        const merchant = req.merchant;

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
            items,
        } = req.body || {};

        if (!branchId && !branchName) {
            return res.status(400).json({
                success: false,
                message: "branchId or branchName is required",
            });
        }

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "latitude and longitude are required with every order",
            });
        }

        const normalizedMode = String(orderMode || "")
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
                message: "selectedArea is required for delivery orders",
            });
        }

        if (!Array.isArray(items) || !items.length) {
            return res.status(400).json({
                success: false,
                message: "At least one order item is required",
            });
        }

        const branchResult = await resolveBranchForMerchant(merchant, {
            branchId,
            branchName,
        });

        if (branchResult.error) {
            return res.status(branchResult.error.status).json({
                success: false,
                message: branchResult.error.message,
            });
        }

        const branch = branchResult.branch;

        if (branch.isActive === false) {
            return res.status(400).json({
                success: false,
                message: "This branch is inactive",
            });
        }

        if (branchId && String(branch._id) !== String(branchId)) {
            return res.status(400).json({
                success: false,
                message: "branchId does not match selected branch",
            });
        }

        if (
            branchName &&
            String(branch.name).trim().toLowerCase() !==
                String(branchName).trim().toLowerCase()
        ) {
            return res.status(400).json({
                success: false,
                message: "branchName does not match selected branch",
            });
        }

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
                });
            }
        }

        const productIds = [
            ...new Set(
                items
                    .map((item) => String(item?.productId || "").trim())
                    .filter(Boolean)
            ),
        ];

        if (!productIds.length || productIds.length !== items.length) {
            // allow duplicate products in cart — only validate each has productId
            const missing = items.find((item) => !item?.productId);
            if (missing) {
                return res.status(400).json({
                    success: false,
                    message: "Each item needs a valid productId",
                });
            }
        }

        const uniqueProductIds = [
            ...new Set(
                items
                    .map((item) => String(item.productId).trim())
                    .filter((id) => mongoose.Types.ObjectId.isValid(id))
            ),
        ];

        if (!uniqueProductIds.length) {
            return res.status(400).json({
                success: false,
                message: "Valid product ids are required",
            });
        }

        const visibility = buildBranchVisibilityFilter({
            merchantId: merchant._id,
            branch,
            showAllOnly: false,
        });

        const products = await Product.find({
            ...visibility,
            _id: { $in: uniqueProductIds },
            isActive: true,
        });

        const productMap = new Map(
            products.map((product) => [String(product._id), product])
        );

        const orderItems = [];
        let subtotal = 0;
        let taxTotal = 0;
        let itemsCount = 0;

        for (let index = 0; index < items.length; index += 1) {
            const raw = items[index] || {};
            const productId = String(raw.productId || "").trim();
            const quantity = Number(raw.quantity);

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid productId at item ${index + 1}`,
                });
            }

            if (!Number.isFinite(quantity) || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity at item ${index + 1}`,
                });
            }

            const product = productMap.get(productId);

            if (!product || !productAvailableForBranch(product, branch)) {
                return res.status(400).json({
                    success: false,
                    message: `Product not available for this branch (item ${index + 1})`,
                });
            }

            if (product.availabilityStatus !== "available") {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} is ${product.availabilityStatus.replaceAll("_", " ")}`,
                });
            }

            let variant = null;
            if (raw.variantId) {
                variant = (product.variants || []).id
                    ? (product.variants || []).id(raw.variantId)
                    : (product.variants || []).find(
                          (item) => String(item._id) === String(raw.variantId)
                      );

                if (!variant || variant.isActive === false) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid variant for ${product.name}`,
                    });
                }
            }

            const unitPrice = resolveUnitPrice(product, variant);
            const basePrice = variant
                ? Number(variant.price) || 0
                : Number(product.price) || 0;
            const discountPrice = variant
                ? variant.discountPrice ?? null
                : product.discountPrice ?? null;

            const selectedAddons = [];
            let addonsTotal = 0;
            const rawAddons = Array.isArray(raw.addons) ? raw.addons : [];

            for (const rawAddon of rawAddons) {
                const addonId = rawAddon?.addonId || rawAddon?.id;
                const addonQty = Number(rawAddon?.quantity || 1);

                if (!addonId || !Number.isFinite(addonQty) || addonQty < 1) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid addon on ${product.name}`,
                    });
                }

                const addon = (product.addons || []).id
                    ? (product.addons || []).id(addonId)
                    : (product.addons || []).find(
                          (item) => String(item._id) === String(addonId)
                      );

                if (!addon || addon.isActive === false) {
                    return res.status(400).json({
                        success: false,
                        message: `Addon not available on ${product.name}`,
                    });
                }

                if (addonQty > (addon.maxQuantity || 1)) {
                    return res.status(400).json({
                        success: false,
                        message: `Addon ${addon.name} max quantity is ${addon.maxQuantity || 1}`,
                    });
                }

                const addonLine = roundMoney(Number(addon.price) * addonQty);
                addonsTotal += addonLine;
                selectedAddons.push({
                    addonId: addon._id,
                    name: addon.name,
                    price: Number(addon.price) || 0,
                    quantity: addonQty,
                    lineTotal: addonLine,
                });
            }

            const requiredAddons = (product.addons || []).filter(
                (addon) => addon.isRequired === true && addon.isActive !== false
            );

            for (const required of requiredAddons) {
                const selected = selectedAddons.find(
                    (addon) => String(addon.addonId) === String(required._id)
                );
                if (!selected) {
                    return res.status(400).json({
                        success: false,
                        message: `Required addon missing: ${required.name} on ${product.name}`,
                    });
                }
            }

            const lineSubtotal = roundMoney(
                (unitPrice + addonsTotal) * quantity
            );
            const lineTax = roundMoney(
                ((Number(product.tax) || 0) / 100) * lineSubtotal
            );
            const lineTotal = roundMoney(lineSubtotal + lineTax);

            subtotal += lineSubtotal;
            taxTotal += lineTax;
            itemsCount += quantity;

            orderItems.push({
                productId: product._id,
                categoryId: product.categoryId || null,
                name: product.name,
                sku: product.sku || "",
                image: product.image || "",
                quantity,
                unitPrice: roundMoney(unitPrice),
                basePrice: roundMoney(basePrice),
                discountPrice:
                    discountPrice === null || discountPrice === undefined
                        ? null
                        : roundMoney(discountPrice),
                tax: Number(product.tax) || 0,
                variant: variant
                    ? {
                          variantId: variant._id,
                          name: variant.name || "",
                          size: variant.size || "",
                          portion: variant.portion || "",
                          price: Number(variant.price) || 0,
                      }
                    : {
                          variantId: null,
                          name: "",
                          size: "",
                          portion: "",
                          price: null,
                      },
                addons: selectedAddons,
                notes: String(raw.notes || "").trim(),
                lineSubtotal,
                lineTax,
                lineTotal,
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

        const fee =
            normalizedMode === "delivery"
                ? roundMoney(Number(deliveryFee) || 0)
                : 0;

        const discountTotal = 0;
        const grandTotal = roundMoney(
            subtotal + taxTotal + fee - discountTotal
        );

        let order;
        let attempts = 0;

        while (attempts < 5) {
            attempts += 1;
            try {
                order = await Order.create({
                    merchantId: merchant._id,
                    bussinessId: merchant.bussinessId,
                    customerId: customer._id,
                    orderNumber: generateOrderNumber(),
                    branchId: branch._id,
                    branchName: branch.name,
                    orderMode: normalizedMode,
                    selectedArea: area,
                    latitude: String(latitude).trim(),
                    longitude: String(longitude).trim(),
                    deliveryAddress: String(deliveryAddress || "").trim(),
                    customerSnapshot: {
                        name: customer.name || "",
                        email: customer.email || "",
                        gender: customer.gender || "",
                        countryCode: customer.countryCode || "",
                        contactNumber: customer.contactNumber || "",
                    },
                    items: orderItems,
                    itemsCount,
                    subtotal: roundMoney(subtotal),
                    taxTotal: roundMoney(taxTotal),
                    deliveryFee: fee,
                    discountTotal,
                    grandTotal,
                    currency: merchant.currency || "PKR",
                    notes: String(notes || "").trim(),
                    paymentMethod: normalizedPayment,
                    paymentStatus: "pending",
                    status: "pending",
                    statusHistory: [
                        {
                            status: "pending",
                            note: "Order placed by customer",
                            at: new Date(),
                        },
                    ],
                });
                break;
            } catch (error) {
                if (error?.code === 11000 && attempts < 5) {
                    continue;
                }
                throw error;
            }
        }

        if (!order) {
            return res.status(500).json({
                success: false,
                message: "Failed to create order number. Please try again",
            });
        }

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: formatOrder(order),
        });
    } catch (error) {
        console.error("Place order error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to place order",
        });
    }
};

export default placeOrder;
