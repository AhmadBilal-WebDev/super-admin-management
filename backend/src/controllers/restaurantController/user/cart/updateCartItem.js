import mongoose from "mongoose";
import Cart from "../../../../models/restaurantModels/cart.js";
import formatCart from "../../../../utils/restaurantUtils/formatCart.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";
import {
    buildValidatedCartItems,
    recalculateCartTotals,
} from "../../../../utils/restaurantUtils/cartLineBuilder.js";

/**
 * Only increase / decrease cart item quantity.
 * Body: { action: "increase" } or { action: "decrease" }
 * Decrease to 0 → item removed.
 */
const updateCartItem = async (req, res) => {
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

        const itemId = req.params.itemId || req.params.id;
        if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
                success: false,
                message: "Valid cart item id is required",
            });
        }

        const action = String(req.body?.action || "")
            .trim()
            .toLowerCase();

        if (!["increase", "decrease"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'action must be "increase" or "decrease"',
            });
        }

        const cart = await Cart.findOne({
            merchantId: merchant._id,
            customerId: customer._id,
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found",
            });
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found",
            });
        }

        const currentQty = Number(item.quantity) || 0;
        const nextQuantity =
            action === "increase" ? currentQty + 1 : currentQty - 1;

        if (nextQuantity <= 0) {
            item.deleteOne();

            const totals = recalculateCartTotals(cart.items);
            cart.itemsCount = totals.itemsCount;
            cart.subtotal = totals.subtotal;
            cart.taxTotal = totals.taxTotal;
            cart.grandTotal = totals.grandTotal;
            await cart.save();

            return res.status(200).json({
                success: true,
                message: "Item removed from cart",
                removed: true,
                quantity: 0,
                cart: formatCart(cart),
            });
        }

        const validated = await buildValidatedCartItems({
            merchant,
            branchId: cart.branchId,
            branchName: cart.branchName,
            items: [
                {
                    productId: item.productId,
                    quantity: nextQuantity,
                    variantId: item.variantId || item.variant?.variantId,
                    addons: item.addons,
                    notes: item.notes,
                },
            ],
        });

        if (validated.error) {
            return res.status(validated.error.status).json({
                success: false,
                message: validated.error.message,
            });
        }

        const next = validated.items[0];
        item.quantity = next.quantity;
        item.unitPrice = next.unitPrice;
        item.basePrice = next.basePrice;
        item.discountPrice = next.discountPrice;
        item.tax = next.tax;
        item.variantId = next.variantId;
        item.variant = next.variant;
        item.addons = next.addons;
        item.notes = next.notes;
        item.name = next.name;
        item.sku = next.sku;
        item.image = next.image;
        item.lineSubtotal = next.lineSubtotal;
        item.lineTax = next.lineTax;
        item.lineTotal = next.lineTotal;

        const totals = recalculateCartTotals(cart.items);
        cart.itemsCount = totals.itemsCount;
        cart.subtotal = totals.subtotal;
        cart.taxTotal = totals.taxTotal;
        cart.grandTotal = totals.grandTotal;

        await cart.save();

        return res.status(200).json({
            success: true,
            message:
                action === "increase"
                    ? "Quantity increased"
                    : "Quantity decreased",
            removed: false,
            quantity: item.quantity,
            cart: formatCart(cart),
        });
    } catch (error) {
        console.error("Update cart item error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update quantity",
        });
    }
};

export default updateCartItem;
