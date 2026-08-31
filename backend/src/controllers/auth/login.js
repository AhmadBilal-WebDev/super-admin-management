import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import LoginSuperAdmin from "../../models/auth/login.js";
import { getAuthorizedSidebar } from "../../constants/sidebarCatalog.js";
import getPublicUser from "../../utils/getPublicUser.js";

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !String(email).trim()) {
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
                message: "No account found with this email",
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Account is blocked. Contact Super Admin",
            });
        }

        const baseUser = {
            email: user.email,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            accountType: user.accountType || "owner",
        };

        // Step 1: email only — tell frontend which screen to show next
        if (!password) {
            if (user.accountType === "role" && user.isEmailVerified === false) {
                const isOtpExpired =
                    !user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now();

                return res.status(200).json({
                    success: true,
                    nextStep: "otp",
                    passwordRequired: false,
                    message: isOtpExpired
                        ? "OTP expired. Ask Super Admin to resend OTP, then enter it"
                        : "Enter the 6-digit OTP sent to your email",
                    otpExpired: isOtpExpired,
                    user: baseUser,
                });
            }

            if (user.isEmailVerified === false) {
                return res.status(403).json({
                    success: false,
                    message: "Please verify your email first",
                });
            }

            if (user.isPasswordSet === false) {
                return res.status(200).json({
                    success: true,
                    nextStep: "set-password",
                    passwordRequired: false,
                    message: "Email verified. Please set your new password",
                    user: baseUser,
                });
            }

            return res.status(200).json({
                success: true,
                nextStep: "password",
                passwordRequired: true,
                message: "Email verified. Password is required",
                user: baseUser,
            });
        }

        // Step 2: email + password — complete login
        if (user.isEmailVerified === false) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email with OTP first",
            });
        }

        if (user.isPasswordSet === false) {
            return res.status(403).json({
                success: false,
                message: "Please set your new password first",
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password",
            });
        }

        user.tokenVersion = (user.tokenVersion || 0) + 1;
        if (user.gender) {
            user.gender = String(user.gender).toLowerCase();
        }
        await user.save();

        const payload = getPublicUser(user);
        payload.tokenVersion = user.tokenVersion;

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                tokenVersion: user.tokenVersion,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        return res.status(200).json({
            success: true,
            nextStep: "dashboard",
            message: "Login successful",
            token,
            user: payload,
            sidebar: getAuthorizedSidebar(user),
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export default login;
