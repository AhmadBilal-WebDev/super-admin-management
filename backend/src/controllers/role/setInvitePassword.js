import bcrypt from "bcryptjs";
import LoginSuperAdmin from "../../models/auth/login.js";

const setInvitePassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, password and confirm password are required",
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

        const user = await LoginSuperAdmin.findOne({
            email: email.toLowerCase().trim(),
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Please verify your email with OTP first",
            });
        }

        user.password = await bcrypt.hash(password, 10);
        user.isPasswordSet = true;
        user.otp = "";
        user.otpExpiresAt = null;
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password set successfully. You can now login",
        });
    } catch (error) {
        console.error("Set invite password error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default setInvitePassword;
