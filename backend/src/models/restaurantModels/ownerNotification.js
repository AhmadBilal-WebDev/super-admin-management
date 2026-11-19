import mongoose from "mongoose";

const ownerNotificationSchema = new mongoose.Schema(
    {
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "merchant",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["new_order", "order_update", "system"],
            default: "new_order",
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "restaurantorder",
            default: null,
            index: true,
        },
        orderNumber: {
            type: String,
            default: "",
            trim: true,
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "branch",
            default: null,
            index: true,
        },
        branchName: {
            type: String,
            default: "",
            trim: true,
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

ownerNotificationSchema.index({ merchantId: 1, createdAt: -1 });
ownerNotificationSchema.index({ merchantId: 1, isRead: 1, createdAt: -1 });

const OwnerNotification = mongoose.model(
    "ownerNotification",
    ownerNotificationSchema
);

export default OwnerNotification;
