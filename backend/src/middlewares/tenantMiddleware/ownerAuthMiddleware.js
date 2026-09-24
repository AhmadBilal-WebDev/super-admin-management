import jwt from "jsonwebtoken";
import Merchant from "../../models/superadminModels/bussiness/merchant.js";
import RevokedOwnerToken from "../../models/restaurantModels/revokedOwnerToken.js";
import { getOwnerTokenKey } from "../../utils/tenantUtils/ownerAuthToken.js";

const ownerAuthMiddleware = async (req, res, next) => {
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

        if (decoded.accountType && decoded.accountType !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Unauthorized. Owner access only",
            });
        }

        const isRevoked = await RevokedOwnerToken.exists({
            jti: getOwnerTokenKey(token, decoded),
        });

        if (isRevoked) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Token is logged out. Please login again",
                tokenExpired: true,
            });
        }

        const merchant = await Merchant.findById(
            decoded.id || decoded.merchantId
        ).select("-password -otp");

        if (!merchant) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Owner not found",
                tokenExpired: false,
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
                tokenExpired: true,
            });
        }

        req.owner = merchant;
        req.tokenPayload = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized. Invalid or expired token",
            tokenExpired: false,
        });
    }
};

export default ownerAuthMiddleware;
