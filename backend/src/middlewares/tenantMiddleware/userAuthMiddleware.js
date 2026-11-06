import jwt from "jsonwebtoken";
import Customer from "../../models/restaurantModels/customer.js";
import Merchant from "../../models/superadminModels/bussiness/merchant.js";

const userAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Token required",
                tokenExpired: false,
            });
        }

        const token = authHeader.split(" ")[1];
        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            const isExpired = error?.name === "TokenExpiredError";
            return res.status(401).json({
                success: false,
                message: isExpired
                    ? "Session expired. Please login again"
                    : "Unauthorized. Invalid or expired token",
                tokenExpired: isExpired,
            });
        }

        if (decoded.accountType && decoded.accountType !== "customer") {
            return res.status(403).json({
                success: false,
                message: "Unauthorized. Customer access only",
            });
        }

        const customer = await Customer.findById(decoded.id || decoded.customerId);

        if (!customer || customer.isActive === false) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Customer not found",
            });
        }

        if ((customer.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again",
                tokenExpired: true,
            });
        }

        if (customer.isVerified !== true) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email OTP first",
            });
        }

        const merchant = await Merchant.findById(customer.merchantId);

        if (!merchant || merchant.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Restaurant is inactive",
            });
        }

        req.accountType = "customer";
        req.customer = customer;
        req.user = customer;
        req.owner = merchant;
        req.merchant = merchant;
        next();
    } catch (error) {
        console.error("User auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Unauthorized",
        });
    }
};

export default userAuthMiddleware;
