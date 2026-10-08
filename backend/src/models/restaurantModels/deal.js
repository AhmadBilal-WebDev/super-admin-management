import mongoose from "mongoose";

const dealItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, default: 1, min: 1 },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "restaurantproduct",
            default: null,
        },
    },
    { _id: true }
);

const dealSchema = new mongoose.Schema(
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
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "branch",
            default: null,
            index: true,
        },
        branchName: {
            type: [String],
            default: [],
        },
        showAllBranches: {
            type: Boolean,
            default: false,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        shortDescription: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        },
        image: {
            type: String,
            default: "",
            trim: true,
        },
        originalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        dealPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        discountPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        items: {
            type: [dealItemSchema],
            default: [],
        },
        termsAndConditions: {
            type: String,
            default: "",
            trim: true,
            maxlength: 2000,
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        createdByType: {
            type: String,
            enum: ["owner", "staff"],
            default: "owner",
        },
    },
    { timestamps: true }
);

dealSchema.index(
    { merchantId: 1, slug: 1, showAllBranches: 1, branchId: 1 },
    { unique: true }
);
dealSchema.index({ merchantId: 1, displayOrder: 1, createdAt: -1 });

const Deal = mongoose.model("restaurantdeal", dealSchema);
export default Deal;
