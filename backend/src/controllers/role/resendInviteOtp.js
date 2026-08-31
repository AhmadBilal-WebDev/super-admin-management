import bcrypt from "bcryptjs";
import sendOtpEmail from "../../utils/sendOtpEmail.js";
import findManageableRole from "../../utils/findManageableRole.js";
import LoginSuperAdmin from "../../models/auth/login.js";
import {
    INVITE_OTP_EXPIRY_MS,
    INVITE_OTP_VALIDITY_TEXT,
} from "../../constants/otpExpiry.js";

const resendInviteOtp = async (req, res) => {
    try {
        let roleUser;

        if (req.params.id) {
            const result = await findManageableRole(req, req.params.id);
            if (result.error) {
                return res.status(result.error.status).json({
                    success: false,
                    message: result.error.message,
                });
            }
            roleUser = result.roleUser;
        } else if (req.body.email) {
            roleUser = await LoginSuperAdmin.findOne({
                email: req.body.email.toLowerCase().trim(),
                accountType: "role",
            });

            if (!roleUser) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found with this email",
                });
            }

            const isOwner = req.user.accountType !== "role";
            const isCreator = String(roleUser.createdBy) === String(req.user._id);

            if (!isOwner && !isCreator) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to resend OTP for this role",
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Role id or email is required",
            });
        }

        if (roleUser.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified for this role",
            });
        }

        if (roleUser.isPasswordSet) {
            return res.status(400).json({
                success: false,
                message: "This role has already completed setup",
            });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const hashedOtp = await bcrypt.hash(otp, 10);

        roleUser.otp = hashedOtp;
        roleUser.otpExpiresAt = new Date(Date.now() + INVITE_OTP_EXPIRY_MS);
        await roleUser.save();

        await sendOtpEmail({
            to: roleUser.email,
            otp,
            name: roleUser.firstName,
            subject: "Super Admin Management - New Verification OTP",
            subtitle: "Email Verification OTP Resent",
            message: `Your Super Admin invitation OTP has been resent. Use this 6-digit code to verify your email in the app. After verification set your new password and login. This code is valid for <strong>${INVITE_OTP_VALIDITY_TEXT}</strong>.`,
        });

        return res.status(200).json({
            success: true,
            message: "New OTP sent successfully",
            email: roleUser.email,
            otpExpiresAt: roleUser.otpExpiresAt,
        });
    } catch (error) {
        console.error("Resend invite OTP error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to resend OTP",
        });
    }
};

export default resendInviteOtp;
