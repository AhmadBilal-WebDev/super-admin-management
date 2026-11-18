import mongoose from "mongoose";
import Cart from "../../../../models/restaurantModels/cart.js";
import formatCart from "../../../../utils/restaurantUtils/formatCart.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";
import { recalculateCartTotals } from "../../../../utils/restaurantUtils/cartLineBuilder.js";

const removeCartItem = async (req, res) => {
    try {
        const domainCheck = assertOwnerDomain(
            req.merchant,
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

        const cart = await Cart.findOne({
            merchantId: req.merchant._id,
            customerId: req.customer._id,
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

        item.deleteOne();

        const totals = recalculateCartTotals(cart.items);
        cart.itemsCount = totals.itemsCount;
        cart.subtotal = totals.subtotal;
        cart.taxTotal = totals.taxTotal;
        cart.grandTotal = totals.grandTotal;

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart item removed",
            cart: formatCart(cart),
        });
    } catch (error) {
        console.error("Remove cart item error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to remove cart item",
        });
    }
};

export default removeCartItem;
