import OwnerNotification from "../../../../models/restaurantModels/ownerNotification.js";
import formatOwnerNotification from "../../../../utils/restaurantUtils/formatOwnerNotification.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
    getRestaurantActor,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";

const getOwnerNotifications = async (req, res) => {
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
                    message: "Notifications fetched successfully",
                    unreadCount: 0,
                    count: 0,
                    notifications: [],
                });
            }

            filter.branchId = { $in: allowedIds };
        }

        if (req.query.isRead !== undefined) {
            const raw = String(req.query.isRead).trim().toLowerCase();
            if (["true", "1"].includes(raw)) filter.isRead = true;
            if (["false", "0"].includes(raw)) filter.isRead = false;
        }

        if (req.query.branchId) {
            filter.branchId = req.query.branchId;
        }

        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

        const [notifications, unreadCount] = await Promise.all([
            OwnerNotification.find(filter)
                .sort({ createdAt: -1 })
                .limit(limit),
            OwnerNotification.countDocuments({
                ...filter,
                isRead: false,
            }),
        ]);

        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            unreadCount,
            count: notifications.length,
            // For bell icon badge
            bell: {
                unreadCount,
                hasUnread: unreadCount > 0,
            },
            notifications: notifications.map(formatOwnerNotification),
        });
    } catch (error) {
        console.error("Get owner notifications error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch notifications",
        });
    }
};

export default getOwnerNotifications;
