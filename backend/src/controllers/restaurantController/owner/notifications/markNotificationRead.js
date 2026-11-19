import mongoose from "mongoose";
import OwnerNotification from "../../../../models/restaurantModels/ownerNotification.js";
import formatOwnerNotification from "../../../../utils/restaurantUtils/formatOwnerNotification.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
    getRestaurantActor,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";

const markNotificationRead = async (req, res) => {
    try {
        const { owner } = getRestaurantActor(req);

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

        const notificationId = req.params.notificationId || req.params.id;

        if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({
                success: false,
                message: "Valid notification id is required",
            });
        }

        const notification = await OwnerNotification.findOneAndUpdate(
            {
                _id: notificationId,
                merchantId: owner._id,
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        const unreadCount = await OwnerNotification.countDocuments({
            merchantId: owner._id,
            isRead: false,
        });

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            unreadCount,
            bell: {
                unreadCount,
                hasUnread: unreadCount > 0,
            },
            notification: formatOwnerNotification(notification),
        });
    } catch (error) {
        console.error("Mark notification read error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to mark notification as read",
        });
    }
};

export default markNotificationRead;
