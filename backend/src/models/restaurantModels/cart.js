import mongoose from "mongoose";

const cartAddonSchema = new mongoose.Schema(
    {
        addonId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        name: { type: String, default: "", trim: true },
        price: { type: Number, default: 0, min: 0 },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        lineTotal: { type: Number, default: 0, min: 0 },
    },
    { _id: false }
);

const cartItemSchema = new mongoose.Schema(
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
        name: { type: String, default: "", trim: true },
        sku: { type: String, default: "", trim: true },
        image: { type: String, default: "", trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, default: 0, min: 0 },
        basePrice: { type: Number, default: 0, min: 0 },
        discountPrice: { type: Number, default: null, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
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
            type: [cartAddonSchema],
            default: [],
        },
        notes: { type: String, default: "", trim: true, maxlength: 500 },
        lineSubtotal: { type: Number, default: 0, min: 0 },
        lineTax: { type: Number, default: 0, min: 0 },
        lineTotal: { type: Number, default: 0, min: 0 },
    },
    { _id: true }
);

const cartSchema = new mongoose.Schema(
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
        items: {
            type: [cartItemSchema],
            default: [],
        },
        itemsCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        subtotal: {
            type: Number,
            default: 0,
            min: 0,
        },
        taxTotal: {
            type: Number,
            default: 0,
            min: 0,
        },
        grandTotal: {
            type: Number,
            default: 0,
            min: 0,
        },
        currency: {
            type: String,
            default: "PKR",
            uppercase: true,
            trim: true,
        },
        // Saved at checkout step (before placing order)
        checkout: {
            isReady: { type: Boolean, default: false },
            orderMode: {
                type: String,
                enum: ["delivery", "pickup", "dine_in", ""],
                default: "",
            },
            paymentMethod: {
                type: String,
                enum: ["cod", "card", "wallet", "other", ""],
                default: "",
            },
            selectedArea: { type: String, default: "", trim: true },
            latitude: { type: String, default: "", trim: true },
            longitude: { type: String, default: "", trim: true },
            deliveryAddress: { type: String, default: "", trim: true },
            deliveryFee: { type: Number, default: 0, min: 0 },
            discountTotal: { type: Number, default: 0, min: 0 },
            checkoutGrandTotal: { type: Number, default: 0, min: 0 },
            notes: { type: String, default: "", trim: true },
            preparedAt: { type: Date, default: null },
        },
    },
    { timestamps: true }
);

cartSchema.index({ merchantId: 1, customerId: 1 }, { unique: true });

const Cart = mongoose.model("restaurantcart", cartSchema);
export default Cart;
