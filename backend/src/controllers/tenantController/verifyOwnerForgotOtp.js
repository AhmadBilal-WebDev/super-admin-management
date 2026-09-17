import bcrypt from "bcryptjs";
import findOwnerMerchant from "../../utils/tenantUtils/findOwnerMerchant.js";
import { OWNER_PASSWORD_RESET_WINDOW_MS } from "../../constants/tenantConstants/otpExpiry.js";

const verifyOwnerForgotOtp = async (req, res) => {
    try {
        const { email, otp, frontendDomainUrl } = req.body;

        if (!email || !otp || !frontendDomainUrl) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP and frontend domain URL are required",
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
                message: "Owner email is not verified",
            });
        }

        if (!merchant.otp || !merchant.otpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }

        if (merchant.otpExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one",
            });
        }

        const isOtpValid = await bcrypt.compare(String(otp), merchant.otp);

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        merchant.otp = "";
        merchant.otpExpiresAt = null;
        merchant.passwordResetAllowedUntil = new Date(
            Date.now() + OWNER_PASSWORD_RESET_WINDOW_MS
        );
        await merchant.save();

        return res.status(200).json({
            success: true,
            nextStep: "set-password",
            message: "OTP verified successfully. Now set your new password",
            passwordResetAllowedUntil: merchant.passwordResetAllowedUntil,
            owner: {
                email: merchant.ownerEmail,
                firstName: merchant.ownerFirstName || "",
                lastName: merchant.ownerLastName || "",
                merchantName: merchant.name,
                frontendDomainUrl: merchant.frontendDomainUrl,
            },
        });
    } catch (error) {
        console.error("Verify owner forgot OTP error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default verifyOwnerForgotOtp;
