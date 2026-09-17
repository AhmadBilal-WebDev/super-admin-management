import bcrypt from "bcryptjs";
import findOwnerMerchant from "../../utils/tenantUtils/findOwnerMerchant.js";

const resetOwnerPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword, frontendDomainUrl } = req.body;

        if (!email || !password || !confirmPassword || !frontendDomainUrl) {
            return res.status(400).json({
                success: false,
                message:
                    "Email, password, confirm password and frontend domain URL are required",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirm password do not match",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
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

        if (
            !merchant.passwordResetAllowedUntil ||
            merchant.passwordResetAllowedUntil.getTime() < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "Password reset session expired. Please verify OTP again",
            });
        }

        merchant.password = await bcrypt.hash(password, 10);
        merchant.isPasswordSet = true;
        merchant.otp = "";
        merchant.otpExpiresAt = null;
        merchant.passwordResetAllowedUntil = null;
        merchant.tokenVersion = (merchant.tokenVersion || 0) + 1;
        await merchant.save();

        return res.status(200).json({
            success: true,
            nextStep: "password",
            message: "Password reset successfully. Please login with your new password",
            owner: {
                email: merchant.ownerEmail,
                firstName: merchant.ownerFirstName || "",
                lastName: merchant.ownerLastName || "",
                merchantName: merchant.name,
                frontendDomainUrl: merchant.frontendDomainUrl,
            },
        });
    } catch (error) {
        console.error("Reset owner password error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default resetOwnerPassword;
