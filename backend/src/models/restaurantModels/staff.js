import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
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
        roleName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        fatherName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        cnic: {
            type: String,
            required: true,
            unique: true,
            trim: true,
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
        district: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
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
        gender: {
            type: String,
            enum: ["male", "female"],
            required: true,
            set: (value) => String(value).toLowerCase(),
        },
        dateOfBirth: {
            type: Date,
            default: null,
        },
        profilePitcher: {
            type: String,
            default: "",
        },
        password: {
            type: String,
            default: "",
            select: false,
        },
        allowedSidebar: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
        otp: {
            type: String,
            default: "",
        },
        otpExpiresAt: {
            type: Date,
            default: null,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isPasswordSet: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        tokenVersion: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "merchant",
            default: null,
        },
    },
    { timestamps: true }
);

const Staff = mongoose.model("restaurantstaff", staffSchema);
export default Staff;
