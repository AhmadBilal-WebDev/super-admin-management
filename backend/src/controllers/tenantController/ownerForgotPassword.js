import bcrypt from "bcryptjs";
import findOwnerMerchant from "../../utils/tenantUtils/findOwnerMerchant.js";
import sendOtpEmail from "../../utils/superadminUtils/sendOtpEmail.js";
import {
    OWNER_FORGOT_OTP_EXPIRY_MS,
    OWNER_FORGOT_OTP_VALIDITY_TEXT,
} from "../../constants/tenantConstants/otpExpiry.js";

const ownerForgotPassword = async (req, res) => {
    try {
        const { email, frontendDomainUrl } = req.body;

        if (!email || !frontendDomainUrl) {
            return res.status(400).json({
                success: false,
                message: "Email and frontend domain URL are required",
            });
        }

        const { merchant, error } = await findOwnerMerchant(email, frontendDomainUrl);

        if (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message,
            });
        }

        if (merchant.isOwnerEmailVerified !== true) {
            return res.status(403).json({
                success: false,
                message: "Owner email is not verified. Please verify your email first",
            });
        }

        if (merchant.isPasswordSet !== true) {
            return res.status(403).json({
                success: false,
                message: "Password is not set yet. Please complete setup first",
            });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const hashedOtp = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + OWNER_FORGOT_OTP_EXPIRY_MS);

        merchant.otp = hashedOtp;
        merchant.otpExpiresAt = otpExpiresAt;
        merchant.passwordResetAllowedUntil = null;
        await merchant.save();

        await sendOtpEmail({
            to: merchant.ownerEmail,
            otp,
            name: merchant.ownerFirstName || "Owner",
            subject: "Owner Password Reset OTP",
            subtitle: "Forgot Password Verification",
            message: `Use this 6-digit OTP to reset your owner password for <strong>${merchant.name}</strong>. This code is valid for <strong>${OWNER_FORGOT_OTP_VALIDITY_TEXT}</strong>.`,
        });

        return res.status(200).json({
            success: true,
            nextStep: "otp",
            message: "OTP sent to your owner email successfully",
            otpExpiresAt,
            owner: {
                email: merchant.ownerEmail,
                firstName: merchant.ownerFirstName || "",
                lastName: merchant.ownerLastName || "",
                merchantName: merchant.name,
                frontendDomainUrl: merchant.frontendDomainUrl,
            },
        });
    } catch (error) {
        console.error("Owner forgot password error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send OTP",
        });
    }
};

export default ownerForgotPassword;
