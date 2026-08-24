import bcrypt from "bcryptjs";
import LoginSuperAdmin from "../../models/auth/login.js";

const verifyInviteEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        const user = await LoginSuperAdmin.findOne({
            email: email.toLowerCase().trim(),
        });

        if (!user || !user.otp || !user.otpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }

        if (user.otpExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please ask Super Admin to create role again",
            });
        }

        const isOtpValid = await bcrypt.compare(String(otp), user.otp);

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        user.isEmailVerified = true;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now set your new password",
        });
    } catch (error) {
        console.error("Verify invite email error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default verifyInviteEmail;
