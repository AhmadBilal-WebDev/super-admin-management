import mongoose from "mongoose";

const loginSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            trim: true,
            default: "",
        },
        lastName: {
            type: String,
            trim: true,
            default: "",
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        bio: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        },
        designation: {
            type: String,
            default: "",
            trim: true,
        },
        country: {
            type: String,
            default: "",
            trim: true,
        },
        province: {
            type: String,
            default: "",
            trim: true,
        },
        city: {
            type: String,
            default: "",
            trim: true,
        },
        district: {
            type: String,
            default: "",
            trim: true,
        },
        address: {
            type: String,
            default: "",
            trim: true,
        },
        countryCode: {
            type: String,
            default: "",
            trim: true,
        },
        contactNumber: {
            type: String,
            default: "",
            trim: true,
        },
        gender: {
            type: String,
            enum: ["male", "female", ""],
            default: "",
            set: (value) => (value ? String(value).toLowerCase() : ""),
        },
        dateOfBirth: {
            type: Date,
            default: null,
        },
        nationalId: {
            type: String,
            default: "",
            trim: true,
        },
        profilePitcher: {
            type: String,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        tokenVersion: {
            type: Number,
            default: 0,
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
            default: true,
        },
        isPasswordSet: {
            type: Boolean,
            default: true,
        },
        accountType: {
            type: String,
            enum: ["owner", "role"],
            default: "owner",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "superadmin",
            default: null,
        },
        allowedSidebar: {
            type: [
                {
                    key: { type: String, required: true },
                    buttons: { type: [String], default: [] },
                },
            ],
            default: [],
        },
    },
    { timestamps: true }
);

const LoginSuperAdmin = mongoose.model("superadmin", loginSchema);
export default LoginSuperAdmin;
