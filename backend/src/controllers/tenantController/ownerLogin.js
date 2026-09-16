import bcrypt from "bcryptjs";
import findOwnerMerchant from "../../utils/tenantUtils/findOwnerMerchant.js";
import getPublicOwner from "../../utils/tenantUtils/getPublicOwner.js";
import { createOwnerToken } from "../../utils/tenantUtils/ownerAuthToken.js";

const ownerLogin = async (req, res) => {
    try {
        const { email, password, frontendDomainUrl } = req.body;

        if (!email || !String(email).trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        if (!frontendDomainUrl || !String(frontendDomainUrl).trim()) {
            return res.status(400).json({
                success: false,
                message: "Frontend domain URL is required",
            });
        }

        const { merchant, error } = await findOwnerMerchant(
            email,
            frontendDomainUrl,
            password ? { withPassword: true } : {}
        );

        if (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message,
            });
        }

        const baseOwner = {
            email: merchant.ownerEmail,
            firstName: merchant.ownerFirstName || "",
            lastName: merchant.ownerLastName || "",
            merchantName: merchant.name,
            frontendDomainUrl: merchant.frontendDomainUrl,
        };

        if (!password) {
            if (merchant.isOwnerEmailVerified !== true) {
                const isOtpExpired =
                    !merchant.otpExpiresAt ||
                    merchant.otpExpiresAt.getTime() < Date.now();

                return res.status(200).json({
                    success: true,
                    nextStep: "otp",
                    passwordRequired: false,
                    message: isOtpExpired
                        ? "OTP expired. Contact Super Admin to resend OTP"
                        : "Enter the 6-digit OTP sent to your owner email",
                    otpExpired: isOtpExpired,
                    owner: baseOwner,
                });
            }

            if (merchant.isPasswordSet !== true) {
                return res.status(200).json({
                    success: true,
                    nextStep: "set-password",
                    passwordRequired: false,
                    message: "Email verified. Please set your new password",
                    owner: baseOwner,
                });
            }

            return res.status(200).json({
                success: true,
                nextStep: "password",
                passwordRequired: true,
                message: "Email verified. Password is required",
                owner: baseOwner,
            });
        }

        if (merchant.isOwnerEmailVerified !== true) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email with OTP first",
            });
        }

        if (merchant.isPasswordSet !== true || !merchant.password) {
            return res.status(403).json({
                success: false,
                message: "Please set your new password first",
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, merchant.password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password",
            });
        }

        const ownerPayload = getPublicOwner(merchant);
        const { token } = createOwnerToken(merchant);

        return res.status(200).json({
            success: true,
            nextStep: "dashboard",
            message: "Owner login successful",
            token,
            owner: ownerPayload,
        });
    } catch (error) {
        console.error("Owner login error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default ownerLogin;
