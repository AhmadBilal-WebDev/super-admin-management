import bcrypt from "bcryptjs";
import Customer from "../../../../models/restaurantModels/customer.js";
import Branch from "../../../../models/superadminModels/bussiness/branch.js";
import findMerchantByDomain from "../../../../utils/restaurantUtils/findMerchantByDomain.js";
import sendCustomerOtpEmail from "../../../../utils/restaurantUtils/sendCustomerOtpEmail.js";
import {
    CUSTOMER_LOGIN_OTP_EXPIRY_MS,
    CUSTOMER_LOGIN_OTP_VALIDITY_TEXT,
} from "../../../../constants/tenantConstants/otpExpiry.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * SIGNIN — existing user: email only → OTP
 * Email not in DB → ask to signup first.
 */
const requestSigninOtp = async (req, res) => {
    try {
        const merchantResult = await findMerchantByDomain(req);

        if (merchantResult.error) {
            return res.status(merchantResult.error.status).json({
                success: false,
                message: merchantResult.error.message,
            });
        }

        const { merchant } = merchantResult;
        const email = String(req.body?.email || "")
            .trim()
            .toLowerCase();

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Valid email is required",
            });
        }

        const customer = await Customer.findOne({
            merchantId: merchant._id,
            email,
        }).select("+otp +otpExpiresAt");

        if (!customer) {
            return res.status(404).json({
                success: false,
                nextStep: "signup",
                message: "Email not found. Please signup first",
            });
        }

        if (customer.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "This account is blocked. Contact the restaurant",
            });
        }

        const branch = await Branch.findById(customer.branchId).select(
            "name otpEmail isActive"
        );

        if (!branch || branch.isActive === false) {
            return res.status(400).json({
                success: false,
                message:
                    "Your branch is unavailable. Please signup again with another branch",
            });
        }

        if (!branch.otpEmail) {
            return res.status(400).json({
                success: false,
                message:
                    "This branch has no OTP email set. Ask superadmin to add otpEmail on the branch",
            });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const hashedOtp = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + CUSTOMER_LOGIN_OTP_EXPIRY_MS);

        customer.otp = hashedOtp;
        customer.otpExpiresAt = otpExpiresAt;
        customer.isVerified = false;
        await customer.save();

        try {
            await sendCustomerOtpEmail({
                to: email,
                otp,
                name: customer.name,
                restaurantName: merchant.name,
                otpEmail: branch.otpEmail,
                validityText: CUSTOMER_LOGIN_OTP_VALIDITY_TEXT,
            });
        } catch (mailError) {
            console.error("Customer signin OTP email error:", mailError);
            return res.status(500).json({
                success: false,
                message:
                    "Failed to send OTP email from restaurant. Please try again",
            });
        }

        return res.status(200).json({
            success: true,
            flow: "signin",
            nextStep: "otp",
            message: `OTP sent to your email from ${merchant.name}`,
            otpExpiresAt,
            user: {
                name: customer.name,
                email: customer.email,
                gender: customer.gender || "",
                countryCode: customer.countryCode || "",
                contactNumber: customer.contactNumber,
                branchId: customer.branchId,
                branchName: branch.name,
                merchantName: merchant.name,
                frontendDomainUrl: merchant.frontendDomainUrl,
            },
        });
    } catch (error) {
        console.error("Customer signin OTP error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send signin OTP",
        });
    }
};

export default requestSigninOtp;
