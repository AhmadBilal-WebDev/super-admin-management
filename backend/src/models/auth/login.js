import mongoose from "mongoose";

const loginSchema = new mongoose.Schema(
    {
        name: {
            type: String,
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
        profilePitcher: {
            type: String,
            default: "",
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

    },
    { timestamps: true }
);

const LoginSuperAdmin = mongoose.model("superadmin", loginSchema);
export default LoginSuperAdmin;
