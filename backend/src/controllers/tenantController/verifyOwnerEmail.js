import bcrypt from "bcryptjs";
import findRestaurantAccount from "../../utils/tenantUtils/findRestaurantAccount.js";

const verifyOwnerEmail = async (req, res) => {
    try {
        const { email, otp, frontendDomainUrl } = req.body;

        if (!email || !otp || !frontendDomainUrl) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP and frontend domain URL are required",
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
            if (merchant.isOwnerEmailVerified === true) {
                return res.status(400).json({
                    success: false,
                    message: "Email is already verified",
                });
            }

            if (!merchant.otp || !merchant.otpExpiresAt) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired OTP",
                });
            }

            if (merchant.otpExpiresAt.getTime() < Date.now()) {
                return res.status(400).json({
                    success: false,
                    message: "OTP has expired. Contact Super Admin to resend OTP",
                });
            }

            const isOtpValid = await bcrypt.compare(String(otp), merchant.otp);

            if (!isOtpValid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid OTP",
                });
            }

            merchant.isOwnerEmailVerified = true;
            await merchant.save();

            return res.status(200).json({
                success: true,
                accountType: "owner",
                nextStep: "set-password",
                message: "Email verified successfully. Now set your new password",
                user: {
                    accountType: "owner",
                    email: merchant.ownerEmail,
                    firstName: merchant.ownerFirstName || "",
                    lastName: merchant.ownerLastName || "",
                    merchantName: merchant.name,
                    frontendDomainUrl: merchant.frontendDomainUrl,
                },
            });
        }

        if (staff.isEmailVerified === true) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }

        if (!staff.otp || !staff.otpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }

        if (staff.otpExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Ask owner to resend OTP",
            });
        }

        const isOtpValid = await bcrypt.compare(String(otp), staff.otp);

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        staff.isEmailVerified = true;
        await staff.save();

        return res.status(200).json({
            success: true,
            accountType: "staff",
            nextStep: "set-password",
            message: "Email verified successfully. Now set your new password",
            user: {
                accountType: "staff",
                email: staff.email,
                firstName: staff.firstName || "",
                lastName: staff.lastName || "",
                roleName: staff.roleName || "",
                merchantName: merchant.name,
                frontendDomainUrl: merchant.frontendDomainUrl,
            },
        });
    } catch (error) {
        console.error("Verify email error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default verifyOwnerEmail;
