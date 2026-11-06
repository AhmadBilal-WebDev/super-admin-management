import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
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
        // Selected branch for this login session context (orders still send lat/lng each time)
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "branch",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        countryCode: {
            type: String,
            default: "",
            trim: true,
        },
        contactNumber: {
            type: String,
            required: true,
            trim: true,
        },
        gender: {
            type: String,
            enum: ["male", "female"],
            set: (value) => String(value || "").toLowerCase().trim(),
        },
        profilePitcher: {
            type: String,
            default: "",
            trim: true,
        },
        otp: {
            type: String,
            default: "",
            select: false,
        },
        otpExpiresAt: {
            type: Date,
            default: null,
            select: false,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        tokenVersion: {
            type: Number,
            default: 0,
        },
        lastLoginAt: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

customerSchema.index({ merchantId: 1, email: 1 }, { unique: true });

const Customer = mongoose.model("customer", customerSchema);
export default Customer;
