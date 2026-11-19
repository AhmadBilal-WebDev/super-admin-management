import mongoose from "mongoose";

const orderAddonSchema = new mongoose.Schema(
    {
        addonId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        lineTotal: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "restaurantproduct",
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "restaurantcategory",
            default: null,
        },
        name: { type: String, required: true, trim: true },
        sku: { type: String, default: "", trim: true },
        image: { type: String, default: "", trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        basePrice: { type: Number, required: true, min: 0 },
        discountPrice: { type: Number, default: null, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
        variant: {
            variantId: {
                type: mongoose.Schema.Types.ObjectId,
                default: null,
            },
            name: { type: String, default: "", trim: true },
            size: { type: String, default: "", trim: true },
            portion: { type: String, default: "", trim: true },
            price: { type: Number, default: null, min: 0 },
        },
        addons: {
            type: [orderAddonSchema],
            default: [],
        },
        notes: { type: String, default: "", trim: true, maxlength: 500 },
        lineSubtotal: { type: Number, required: true, min: 0 },
        lineTax: { type: Number, default: 0, min: 0 },
        lineTotal: { type: Number, required: true, min: 0 },
    },
    { _id: true }
);

const orderSchema = new mongoose.Schema(
    {
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "merchant",
            required: true,
            index: true,
        },
        bussinessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "bussiness",
            required: true,
            index: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "customer",
            required: true,
            index: true,
        },
        orderNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            index: true,
        },
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "branch",
            required: true,
            index: true,
        },
        branchName: {
            type: String,
            required: true,
            trim: true,
        },
        orderMode: {
            type: String,
            enum: ["delivery", "pickup", "dine_in"],
            required: true,
            index: true,
        },
        selectedArea: {
            type: String,
            default: "",
            trim: true,
        },
        // Customer location for this order (not stored permanently on profile)
        latitude: {
            type: String,
            required: true,
            trim: true,
        },
        longitude: {
            type: String,
            required: true,
            trim: true,
        },
        deliveryAddress: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        },
        customerSnapshot: {
            name: { type: String, default: "", trim: true },
            email: { type: String, default: "", trim: true },
            gender: { type: String, default: "", trim: true },
            countryCode: { type: String, default: "", trim: true },
            contactNumber: { type: String, default: "", trim: true },
            profilePitcher: { type: String, default: "", trim: true },
            branchId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "branch",
                default: null,
            },
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (value) => Array.isArray(value) && value.length > 0,
                message: "Order must have at least one item",
            },
        },
        itemsCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        taxTotal: {
            type: Number,
            default: 0,
            min: 0,
        },
        deliveryFee: {
            type: Number,
            default: 0,
            min: 0,
        },
        discountTotal: {
            type: Number,
            default: 0,
            min: 0,
        },
        grandTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "PKR",
            uppercase: true,
            trim: true,
        },
        notes: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000,
        },
        paymentMethod: {
            type: String,
            enum: ["cod", "card", "wallet", "other"],
            default: "cod",
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
            index: true,
        },
        status: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "preparing",
                "ready",
                "out_for_delivery",
                "delivered",
                "completed",
                "cancelled",
            ],
            default: "pending",
            index: true,
        },
        statusHistory: [
            {
                status: { type: String, required: true },
                note: { type: String, default: "", trim: true },
                at: { type: Date, default: Date.now },
            },
        ],
        cancelledAt: {
            type: Date,
            default: null,
        },
        cancelReason: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { timestamps: true }
);

orderSchema.index({ merchantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ merchantId: 1, customerId: 1, createdAt: -1 });
orderSchema.index({ merchantId: 1, branchId: 1, createdAt: -1 });

const Order = mongoose.model("restaurantorder", orderSchema);
export default Order;
