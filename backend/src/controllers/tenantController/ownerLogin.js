import bcrypt from "bcryptjs";
import findRestaurantAccount from "../../utils/tenantUtils/findRestaurantAccount.js";
import getPublicOwner from "../../utils/tenantUtils/getPublicOwner.js";
import getPublicStaff from "../../utils/restaurantUtils/getPublicStaff.js";
import { createOwnerToken } from "../../utils/tenantUtils/ownerAuthToken.js";
import { createStaffToken } from "../../utils/restaurantUtils/staffAuthToken.js";
import { getRestaurantSidebarForUser } from "../../constants/restaurantConstant/sidebarCatalog.js";

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

        const { accountType, merchant, staff, error } = await findRestaurantAccount(
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

        if (accountType === "owner") {
            const baseUser = {
                accountType: "owner",
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
                        accountType: "owner",
                        nextStep: "otp",
                        passwordRequired: false,
                        message: isOtpExpired
                            ? "OTP expired. Contact Super Admin to resend OTP"
                            : "Enter the 6-digit OTP sent to your email",
                        otpExpired: isOtpExpired,
                        user: baseUser,
                    });
                }

                if (merchant.isPasswordSet !== true) {
                    return res.status(200).json({
                        success: true,
                        accountType: "owner",
                        nextStep: "set-password",
                        passwordRequired: false,
                        message: "Email verified. Please set your new password",
                        user: baseUser,
                    });
                }

                return res.status(200).json({
                    success: true,
                    accountType: "owner",
                    nextStep: "password",
                    passwordRequired: true,
                    message: "Email verified. Password is required",
                    user: baseUser,
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

            const isPasswordMatch = await bcrypt.compare(
                password,
                merchant.password
            );

            if (!isPasswordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid password",
                });
            }

            const { token } = createOwnerToken(merchant);

            return res.status(200).json({
                success: true,
                accountType: "owner",
                nextStep: "dashboard",
                message: "Owner login successful",
                token,
                owner: getPublicOwner(merchant),
                sidebar: getRestaurantSidebarForUser(merchant),
            });
        }

        // Staff / restaurant role account
        const baseUser = {
            accountType: "staff",
            email: staff.email,
            firstName: staff.firstName || "",
            lastName: staff.lastName || "",
            roleName: staff.roleName || "",
            merchantName: merchant.name,
            frontendDomainUrl: merchant.frontendDomainUrl,
        };

        if (!password) {
            if (staff.isEmailVerified !== true) {
                const isOtpExpired =
                    !staff.otpExpiresAt ||
                    staff.otpExpiresAt.getTime() < Date.now();

                return res.status(200).json({
                    success: true,
                    accountType: "staff",
                    nextStep: "otp",
                    passwordRequired: false,
                    message: isOtpExpired
                        ? "OTP expired. Ask owner to resend OTP"
                        : "Enter the 6-digit OTP sent to your email",
                    otpExpired: isOtpExpired,
                    user: baseUser,
                });
            }

            if (staff.isPasswordSet !== true) {
                return res.status(200).json({
                    success: true,
                    accountType: "staff",
                    nextStep: "set-password",
                    passwordRequired: false,
                    message: "Email verified. Please set your new password",
                    user: baseUser,
                });
            }

            return res.status(200).json({
                success: true,
                accountType: "staff",
                nextStep: "password",
                passwordRequired: true,
                message: "Email verified. Password is required",
                user: baseUser,
            });
        }

        if (staff.isEmailVerified !== true) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email with OTP first",
            });
        }

        if (staff.isPasswordSet !== true || !staff.password) {
            return res.status(403).json({
                success: false,
                message: "Please set your new password first",
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, staff.password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password",
            });
        }

        const { token } = createStaffToken(staff);

        return res.status(200).json({
            success: true,
            accountType: "staff",
            nextStep: "dashboard",
            message: "Staff login successful",
            token,
            staff: getPublicStaff(staff),
            sidebar: getRestaurantSidebarForUser(staff),
        });
    } catch (error) {
        console.error("Restaurant login error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default ownerLogin;
