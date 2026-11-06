import bcrypt from "bcryptjs";
import Customer from "../../../../models/restaurantModels/customer.js";
import Branch from "../../../../models/superadminModels/bussiness/branch.js";
import findMerchantByDomain from "../../../../utils/restaurantUtils/findMerchantByDomain.js";
import getPublicCustomer from "../../../../utils/restaurantUtils/getPublicCustomer.js";
import { createUserToken } from "../../../../utils/restaurantUtils/userAuthToken.js";

/**
 * Step 2: Verify OTP → customer logged in (token).
 * Lat/lng still not stored — send with each order later.
 */
const verifyLoginOtp = async (req, res) => {
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
        const otp = String(req.body?.otp || "").trim();

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        const customer = await Customer.findOne({
            merchantId: merchant._id,
            email,
        }).select("+otp +otpExpiresAt");

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "No login request found. Please request OTP first",
            });
        }

        if (customer.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "This account is blocked. Contact the restaurant",
            });
        }

        if (!customer.otp || !customer.otpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP. Please request a new one",
            });
        }

        if (customer.otpExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one",
            });
        }

        const isOtpValid = await bcrypt.compare(otp, customer.otp);

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        customer.isVerified = true;
        customer.otp = "";
        customer.otpExpiresAt = null;
        customer.lastLoginAt = new Date();
        await customer.save();

        const branch = await Branch.findById(customer.branchId).select(
            "name branchCode city latitude longitude isActive"
        );

        const { token } = createUserToken(customer);

        return res.status(200).json({
            success: true,
            nextStep: "home",
            message: "Login successful",
            token,
            accountType: "customer",
            user: getPublicCustomer(customer, { branch, merchant }),
            branch: branch
                ? {
                      id: branch._id,
                      name: branch.name,
                      branchCode: branch.branchCode || "",
                      city: branch.city || "",
                      latitude: branch.latitude || "",
                      longitude: branch.longitude || "",
                  }
                : null,
        });
    } catch (error) {
        console.error("Verify customer login OTP error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to verify OTP",
        });
    }
};

export default verifyLoginOtp;
