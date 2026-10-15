import RevokedOwnerToken from "../../../models/restaurantModels/revokedOwnerToken.js";
import {
    getOwnerTokenKey,
    getOwnerTokenExpiryDate,
} from "../../../utils/tenantUtils/ownerAuthToken.js";
import { getRestaurantActor } from "../../../utils/restaurantUtils/findManageableStaff.js";

const ownerLogout = async (req, res) => {
    try {
        const { accountType, owner, actor } = getRestaurantActor(req);
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
                ownerId: owner._id,
                expiresAt: getOwnerTokenExpiryDate(decoded),
            },
            { upsert: true }
        );

        return res.status(200).json({
            success: true,
            message:
                accountType === "staff"
                    ? "Staff logged out successfully"
                    : "Owner logged out successfully",
            accountType,
            email:
                accountType === "staff" ? actor.email : owner.ownerEmail,
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to logout",
        });
    }
};

export default ownerLogout;
