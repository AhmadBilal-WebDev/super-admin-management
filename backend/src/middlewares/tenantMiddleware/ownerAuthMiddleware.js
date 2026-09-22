import jwt from "jsonwebtoken";
import Merchant from "../../models/superadminModels/bussiness/merchant.js";

const ownerAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Token required",
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.accountType && decoded.accountType !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Unauthorized. Owner access only",
            });
        }

        const merchant = await Merchant.findById(
            decoded.id || decoded.merchantId
        ).select("-password -otp");

        if (!merchant) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Owner not found",
            });
        }

        if (merchant.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "This merchant account is inactive",
            });
        }

        if (decoded.tokenVersion !== (merchant.tokenVersion || 0)) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Token is no longer valid. Please login again",
            });
        }

        req.owner = merchant;
        req.tokenPayload = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized. Invalid or expired token",
        });
    }
};

export default ownerAuthMiddleware;
