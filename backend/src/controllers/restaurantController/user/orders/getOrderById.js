import mongoose from "mongoose";
import Order from "../../../../models/restaurantModels/order.js";
import formatOrder from "../../../../utils/restaurantUtils/formatOrder.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";

const getOrderById = async (req, res) => {
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

        const orderId = req.params.orderId || req.params.id;

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Valid order id is required",
            });
        }

        const order = await Order.findOne({
            _id: orderId,
            merchantId: merchant._id,
            customerId: customer._id,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            order: formatOrder(order),
        });
    } catch (error) {
        console.error("Get order by id error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch order",
        });
    }
};

export default getOrderById;
