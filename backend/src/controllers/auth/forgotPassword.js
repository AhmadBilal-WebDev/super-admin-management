import bcrypt from "bcryptjs";
import LoginSuperAdmin from "../../models/auth/login.js";
import sendOtpEmail from "../../utils/sendOtpEmail.js";

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const user = await LoginSuperAdmin.findOne({
            email: email.toLowerCase().trim(),
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Super admin not found with this email",
            });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.otp = hashedOtp;
        user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        await sendOtpEmail({
            to: user.email,
            otp,
            name: user.name || "Super Admin",
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent to your email successfully",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send OTP",
        });
    }
};

export default forgotPassword;
