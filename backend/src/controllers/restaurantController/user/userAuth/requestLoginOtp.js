import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Branch from "../../../../models/superadminModels/bussiness/branch.js";
import Customer from "../../../../models/restaurantModels/customer.js";
import findMerchantByDomain from "../../../../utils/restaurantUtils/findMerchantByDomain.js";
import sendCustomerOtpEmail from "../../../../utils/restaurantUtils/sendCustomerOtpEmail.js";
import {
    CUSTOMER_LOGIN_OTP_EXPIRY_MS,
    CUSTOMER_LOGIN_OTP_VALIDITY_TEXT,
} from "../../../../constants/tenantConstants/otpExpiry.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * SIGNUP — new user: name, email, contact, branch → OTP
 * Existing email → ask to sign in instead.
 */
const requestLoginOtp = async (req, res) => {
    try {
        const merchantResult = await findMerchantByDomain(req);

        if (merchantResult.error) {
            return res.status(merchantResult.error.status).json({
                success: false,
                message: merchantResult.error.message,
            });
        }

        const { merchant } = merchantResult;

        const name = String(req.body?.name || "").trim();
        const email = String(req.body?.email || "")
            .trim()
            .toLowerCase();
        const contactNumber = String(
            req.body?.contactNumber || req.body?.phone || ""
        ).trim();
        const countryCode = String(
            req.body?.countryCode || req.body?.country_code || ""
        ).trim();
        const gender = String(req.body?.gender || "")
            .toLowerCase()
            .trim();
        const branchId = req.body?.branchId || req.body?.branch_id;
        const branchName = String(
            req.body?.branchName || req.body?.branch || ""
        ).trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required",
            });
        }

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Valid email is required",
            });
        }

        if (!contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Contact number is required",
            });
        }

        if (!["male", "female"].includes(gender)) {
            return res.status(400).json({
                success: false,
                message: "Gender must be male or female",
            });
        }

        if (!branchId && !branchName) {
            return res.status(400).json({
                success: false,
                message: "Branch id or branch name is required",
            });
        }

        const existing = await Customer.findOne({
            merchantId: merchant._id,
            email,
        }).select("_id isActive");

        if (existing) {
            if (existing.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message: "This account is blocked. Contact the restaurant",
                });
            }

            return res.status(409).json({
                success: false,
                nextStep: "signin",
                message: "Email already exists. Please login",
            });
        }

        const branchFilter = {
            merchantId: merchant._id,
            isActive: true,
        };

        if (branchId) {
            if (!mongoose.Types.ObjectId.isValid(branchId)) {
                return res.status(400).json({
                    success: false,
                    message: "Valid branch id is required",
                });
            }
            branchFilter._id = branchId;
        } else {
            branchFilter.name = new RegExp(
                `^${branchName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                "i"
            );
        }

        const branch = await Branch.findOne(branchFilter);

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: "Selected branch not found for this restaurant",
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

        await Customer.create({
            merchantId: merchant._id,
            bussinessId: merchant.bussinessId,
            branchId: branch._id,
            name,
            email,
            gender,
            countryCode,
            contactNumber,
            otp: hashedOtp,
            otpExpiresAt,
            isVerified: false,
        });

        try {
            await sendCustomerOtpEmail({
                to: email,
                otp,
                name,
                restaurantName: merchant.name,
                otpEmail: branch.otpEmail,
                validityText: CUSTOMER_LOGIN_OTP_VALIDITY_TEXT,
            });
        } catch (mailError) {
            console.error("Customer signup OTP email error:", mailError);
            return res.status(500).json({
                success: false,
                message:
                    "Failed to send OTP email from restaurant. Please try again",
            });
        }

        return res.status(200).json({
            success: true,
            flow: "signup",
            nextStep: "otp",
            message: `OTP sent to your email from ${merchant.name}`,
            otpExpiresAt,
            user: {
                name,
                email,
                gender,
                countryCode,
                contactNumber,
                branchId: branch._id,
                branchName: branch.name,
                merchantName: merchant.name,
                frontendDomainUrl: merchant.frontendDomainUrl,
            },
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                nextStep: "signin",
                message: "Email already exists. Please login",
            });
        }

        console.error("Customer signup OTP error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send signup OTP",
        });
    }
};

export default requestLoginOtp;
