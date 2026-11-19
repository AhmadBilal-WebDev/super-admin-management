const formatOwnerNotification = (notification) => ({
    id: notification._id,
    type: notification.type || "new_order",
    title: notification.title || "",
    message: notification.message || "",
    orderId: notification.orderId || null,
    orderNumber: notification.orderNumber || "",
    branchId: notification.branchId || null,
    branchName: notification.branchName || "",
    data: notification.data || {},
    isRead: notification.isRead === true,
    readAt: notification.readAt || null,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
});

export default formatOwnerNotification;
