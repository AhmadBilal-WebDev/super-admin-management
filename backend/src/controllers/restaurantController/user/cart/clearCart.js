import Cart from "../../../../models/restaurantModels/cart.js";
import formatCart from "../../../../utils/restaurantUtils/formatCart.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";

const clearCart = async (req, res) => {
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

        let cart = await Cart.findOne({
            merchantId: req.merchant._id,
            customerId: req.customer._id,
        });

        if (!cart) {
            cart = await Cart.create({
                merchantId: req.merchant._id,
                bussinessId: req.merchant.bussinessId,
                customerId: req.customer._id,
                currency: req.merchant.currency || "PKR",
                items: [],
            });
        } else {
            cart.items = [];
            cart.itemsCount = 0;
            cart.subtotal = 0;
            cart.taxTotal = 0;
            cart.grandTotal = 0;
            await cart.save();
        }

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            cart: formatCart(cart),
        });
    } catch (error) {
        console.error("Clear cart error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to clear cart",
        });
    }
};

export default clearCart;
