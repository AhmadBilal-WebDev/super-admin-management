import bcrypt from "bcryptjs";
import findRestaurantAccount from "../../utils/tenantUtils/findRestaurantAccount.js";
import getPublicOwner from "../../utils/tenantUtils/getPublicOwner.js";
import getPublicStaff from "../../utils/restaurantUtils/getPublicStaff.js";
import { createOwnerToken } from "../../utils/tenantUtils/ownerAuthToken.js";
import { createStaffToken } from "../../utils/restaurantUtils/staffAuthToken.js";
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

        const { accountType, merchant, staff, error } = await findRestaurantAccount(
            email,
            frontendDomainUrl
        );

        if (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message,
            });
        }

        if (accountType === "owner") {
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

            const { token } = createOwnerToken(merchant);

            return res.status(200).json({
                success: true,
                accountType: "owner",
                nextStep: "dashboard",
                message: "Password set successfully. Owner login successful",
                token,
                owner: getPublicOwner(merchant),
                sidebar: getRestaurantSidebarForUser(merchant),
            });
        }

        if (staff.isEmailVerified !== true) {
            return res.status(400).json({
                success: false,
                message: "Please verify your email with OTP first",
            });
        }

        staff.password = await bcrypt.hash(password, 10);
        staff.isPasswordSet = true;
        staff.otp = "";
        staff.otpExpiresAt = null;
        staff.tokenVersion = (staff.tokenVersion || 0) + 1;
        await staff.save();

        const { token } = createStaffToken(staff);

        return res.status(200).json({
            success: true,
            accountType: "staff",
            nextStep: "dashboard",
            message: "Password set successfully. Staff login successful",
            token,
            staff: getPublicStaff(staff),
            sidebar: getRestaurantSidebarForUser(staff),
        });
    } catch (error) {
        console.error("Set password error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default setOwnerPassword;
