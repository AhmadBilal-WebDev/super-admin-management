import RevokedOwnerToken from "../../../models/restaurantModels/revokedOwnerToken.js";
import {
    getOwnerTokenKey,
    getOwnerTokenExpiryDate,
} from "../../../utils/tenantUtils/ownerAuthToken.js";

const ownerLogout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : "";
        const decoded = req.tokenPayload || {};
        const jti = getOwnerTokenKey(token, decoded);

        await RevokedOwnerToken.updateOne(
            { jti },
            {
                jti,
                ownerId: req.owner._id,
                expiresAt: getOwnerTokenExpiryDate(decoded),
            },
            { upsert: true }
        );

        return res.status(200).json({
            success: true,
            message: "Owner logged out successfully",
            email: req.owner.ownerEmail,
        });
    } catch (error) {
        console.error("Owner logout error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to logout",
        });
    }
};

export default ownerLogout;
