import Order from "../../../../models/restaurantModels/order.js";
import Customer from "../../../../models/restaurantModels/customer.js";
import formatOrder from "../../../../utils/restaurantUtils/formatOrder.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
    getRestaurantActor,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";
import { resolveBranchForMerchant } from "../../../../utils/restaurantUtils/catalogScope.js";

/**
 * Owner dashboard: show customer orders with full user details
 * - All branches: GET /orders
 * - One branch:   ?branchName=DHA  OR  ?branchId=...
 */
const getOwnerOrders = async (req, res) => {
    try {
        const { actor, owner, accountType } = getRestaurantActor(req);

        const domainCheck = assertOwnerDomain(
            owner,
            getFrontendDomainFromRequest(req)
        );

        if (domainCheck.error) {
            return res.status(domainCheck.error.status).json({
                success: false,
                message: domainCheck.error.message,
            });
        }

        const filter = { merchantId: owner._id };

        if (
            accountType === "staff" &&
            actor.accessAllBranches !== true
        ) {
            const allowedIds = Array.isArray(actor.branchIds)
                ? actor.branchIds
                : [];

            if (!allowedIds.length) {
                return res.status(200).json({
                    success: true,
                    message: "Orders fetched successfully",
                    count: 0,
                    orders: [],
                });
            }

            filter.branchId = { $in: allowedIds };
        }

        const branchId = req.query.branchId
            ? String(req.query.branchId).trim()
            : "";
        const branchName = req.query.branchName
            ? String(req.query.branchName).trim()
            : "";

        if (branchId || branchName) {
            const branchResult = await resolveBranchForMerchant(owner, {
                branchId: branchId || undefined,
                branchName: branchName || undefined,
            });

            if (branchResult.error) {
                return res.status(branchResult.error.status).json({
                    success: false,
                    message: branchResult.error.message,
                });
            }

            if (
                accountType === "staff" &&
                actor.accessAllBranches !== true
            ) {
                const allowedIds = Array.isArray(actor.branchIds)
                    ? actor.branchIds
                    : [];
                const allowed = allowedIds.some(
                    (id) => String(id) === String(branchResult.branch._id)
                );
                if (!allowed) {
                    return res.status(403).json({
                        success: false,
                        message: "You do not have access to this branch",
                    });
                }
            }

            filter.branchId = branchResult.branch._id;
        }

        if (req.query.status) {
            filter.status = String(req.query.status).trim().toLowerCase();
        }

        const orders = await Order.find(filter).sort({ createdAt: -1 });

        const customerIds = [
            ...new Set(
                orders
                    .map((order) => String(order.customerId || ""))
                    .filter(Boolean)
            ),
        ];

        const customers = customerIds.length
            ? await Customer.find({
                  _id: { $in: customerIds },
                  merchantId: owner._id,
              }).select(
                  "name email gender countryCode contactNumber profilePitcher branchId isActive isVerified"
              )
            : [];

        const customerMap = new Map(
            customers.map((customer) => [String(customer._id), customer])
        );

        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            count: orders.length,
            orders: orders.map((order) =>
                formatOrder(
                    order,
                    customerMap.get(String(order.customerId)) || null
                )
            ),
        });
    } catch (error) {
        console.error("Get owner orders error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch orders",
        });
    }
};

export default getOwnerOrders;
