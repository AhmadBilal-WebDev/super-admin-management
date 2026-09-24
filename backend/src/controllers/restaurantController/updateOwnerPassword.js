import bcrypt from "bcryptjs";
import Merchant from "../../models/superadminModels/bussiness/merchant.js";

const updateOwnerPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password, new password and confirm password are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password",
            });
        }

        const merchant = await Merchant.findById(req.owner._id).select("+password");

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: "Owner not found",
            });
        }

        if (!merchant.password || merchant.isPasswordSet !== true) {
            return res.status(400).json({
                success: false,
                message: "Password is not set yet. Please set password first",
            });
        }

        const isCurrentPasswordMatch = await bcrypt.compare(
            currentPassword,
            merchant.password
        );

        if (!isCurrentPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        merchant.password = await bcrypt.hash(newPassword, 10);
        merchant.isPasswordSet = true;
        merchant.tokenVersion = (merchant.tokenVersion || 0) + 1;
        await merchant.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully. Please login again",
        });
    } catch (error) {
        console.error("Update owner password error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update password",
        });
    }
};

export default updateOwnerPassword;
