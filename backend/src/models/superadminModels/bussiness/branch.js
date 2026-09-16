import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
    {
        bussinessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "bussiness",
            required: true,
            index: true,
        },
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "merchant",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        nameKey: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        branchCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },
        province: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        district: {
            type: String,
            required: true,
            trim: true,
        },
        postalCode: {
            type: String,
            default: "",
            trim: true,
        },
        countryCode: {
            type: String,
            required: true,
            trim: true,
        },
        contactNumber: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            default: "",
            lowercase: true,
            trim: true,
        },
        managerName: {
            type: String,
            default: "",
            trim: true,
        },
        managerContact: {
            type: String,
            default: "",
            trim: true,
        },
        openingTime: {
            type: String,
            default: "",
            trim: true,
        },
        closingTime: {
            type: String,
            default: "",
            trim: true,
        },
        latitude: {
            type: String,
            default: "",
            trim: true,
        },
        longitude: {
            type: String,
            default: "",
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "superadmin",
            default: null,
        },
    },
    { timestamps: true }
);

branchSchema.index({ merchantId: 1, nameKey: 1 }, { unique: true });
branchSchema.index({ merchantId: 1, slug: 1 }, { unique: true });
branchSchema.index({ merchantId: 1, branchCode: 1 }, { unique: true });

const Branch = mongoose.model("branch", branchSchema);
export default Branch;
