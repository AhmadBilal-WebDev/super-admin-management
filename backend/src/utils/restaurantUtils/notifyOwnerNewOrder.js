import OwnerNotification from "../../models/restaurantModels/ownerNotification.js";
import { emitNewOrderToOwner } from "../../socket/restaurantSocket.js";
import formatOrder from "./formatOrder.js";

const notifyOwnerNewOrder = async ({ order, customer = null }) => {
    if (!order?.merchantId) return null;

    const formattedOrder = formatOrder(order, customer);
    const customerName =
        formattedOrder.customer?.name ||
        order.customerSnapshot?.name ||
        "Customer";

    const title = "New order received";
    const message = `${customerName} placed order ${order.orderNumber} (${order.orderMode}) — ${order.currency || "PKR"} ${order.grandTotal}`;

    const notification = await OwnerNotification.create({
        merchantId: order.merchantId,
        type: "new_order",
        title,
        message,
        orderId: order._id,
        orderNumber: order.orderNumber,
        branchId: order.branchId || null,
        branchName: order.branchName || "",
        data: {
            order: formattedOrder,
            customer: formattedOrder.customer,
            grandTotal: order.grandTotal,
            currency: order.currency || "PKR",
            orderMode: order.orderMode,
            paymentMethod: order.paymentMethod || "cod",
            itemsCount: order.itemsCount ?? 0,
        },
        isRead: false,
    });

    const payload = {
        notificationId: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: false,
        orderId: order._id,
        orderNumber: order.orderNumber,
        branchId: order.branchId || null,
        branchName: order.branchName || "",
        order: formattedOrder,
        customer: formattedOrder.customer,
        createdAt: notification.createdAt,
        // Bell helpers for web + mobile
        bell: {
            show: true,
            unreadIncrement: 1,
            sound: true,
        },
    };

    emitNewOrderToOwner({
        merchantId: order.merchantId,
        branchId: order.branchId,
        payload,
    });

    return notification;
};

export default notifyOwnerNewOrder;
