import OwnerNotification from "../../../../models/restaurantModels/ownerNotification.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
    getRestaurantActor,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";

const markAllNotificationsRead = async (req, res) => {
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

        const filter = {
            merchantId: owner._id,
            isRead: false,
        };

        if (
            accountType === "staff" &&
            actor.accessAllBranches !== true
        ) {
            const allowedIds = Array.isArray(actor.branchIds)
                ? actor.branchIds
                : [];
            filter.branchId = { $in: allowedIds };
        }

        const result = await OwnerNotification.updateMany(filter, {
            $set: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount || 0,
            unreadCount: 0,
            bell: {
                unreadCount: 0,
                hasUnread: false,
            },
        });
    } catch (error) {
        console.error("Mark all notifications read error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to mark notifications as read",
        });
    }
};

export default markAllNotificationsRead;
