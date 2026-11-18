import Cart from "../../../../models/restaurantModels/cart.js";
import formatCart from "../../../../utils/restaurantUtils/formatCart.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";

const getCart = async (req, res) => {
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
        }

        return res.status(200).json({
            success: true,
            message: "Cart fetched successfully",
            requiresLogin: false,
            cart: formatCart(cart),
        });
    } catch (error) {
        console.error("Get cart error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch cart",
        });
    }
};

export default getCart;
