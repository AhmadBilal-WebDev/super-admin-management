import mongoose from "mongoose";
import Order from "../../../../models/restaurantModels/order.js";
import formatOrder from "../../../../utils/restaurantUtils/formatOrder.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";

const getMyOrders = async (req, res) => {
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

        const filter = {
            merchantId: merchant._id,
            customerId: customer._id,
        };

        if (req.query.status) {
            filter.status = String(req.query.status).trim().toLowerCase();
        }

        if (req.query.branchId && mongoose.Types.ObjectId.isValid(req.query.branchId)) {
            filter.branchId = req.query.branchId;
        }

        const orders = await Order.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            count: orders.length,
            orders: orders.map(formatOrder),
        });
    } catch (error) {
        console.error("Get my orders error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch orders",
        });
    }
};

export default getMyOrders;
