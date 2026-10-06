import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
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
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        shortText: {
            type: String,
            default: "",
            trim: true,
            maxlength: 300,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 2000,
        },
        image: {
            type: String,
            default: "",
            trim: true,
        },
        tag: {
            type: String,
            default: "",
            trim: true,
            maxlength: 80,
        },
        buttonText: {
            type: String,
            default: "",
            trim: true,
            maxlength: 80,
        },
        buttonLink: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        },
        secondaryButtonText: {
            type: String,
            default: "",
            trim: true,
            maxlength: 80,
        },
        secondaryButtonLink: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
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

bannerSchema.index({ merchantId: 1, displayOrder: 1, createdAt: -1 });
bannerSchema.index({ merchantId: 1, isActive: 1, showAllBranches: 1, branchId: 1 });

const Banner = mongoose.model("restaurantbanner", bannerSchema);
export default Banner;
