import bcrypt from "bcryptjs";
import findOwnerMerchant from "../../utils/tenantUtils/findOwnerMerchant.js";
import getPublicOwner from "../../utils/tenantUtils/getPublicOwner.js";
import { createOwnerToken } from "../../utils/tenantUtils/ownerAuthToken.js";
import { getRestaurantSidebarForUser } from "../../constants/restaurantConstant/sidebarCatalog.js";

const setOwnerPassword = async (req, res) => {
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
            return res.status(400).json({
                success: false,
                message: "Please verify your email with OTP first",
            });
        }

        merchant.password = await bcrypt.hash(password, 10);
        merchant.isPasswordSet = true;
        merchant.otp = "";
        merchant.otpExpiresAt = null;
        await merchant.save();

        const ownerPayload = getPublicOwner(merchant);
        const { token } = createOwnerToken(merchant);

        return res.status(200).json({
            success: true,
            nextStep: "dashboard",
            message: "Password set successfully. Owner login successful",
            token,
            owner: ownerPayload,
            sidebar: getRestaurantSidebarForUser(merchant),
        });
    } catch (error) {
        console.error("Set owner password error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default setOwnerPassword;
