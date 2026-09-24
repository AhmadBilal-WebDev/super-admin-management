import deleteCloudinaryImage from "../../utils/superadminUtils/deleteCloudinaryImage.js";
import Merchant from "../../models/superadminModels/bussiness/merchant.js";
import getPublicOwner from "../../utils/tenantUtils/getPublicOwner.js";

const removeOwnerProfilePitcher = async (req, res) => {
    try {
        const merchant = await Merchant.findById(req.owner._id);

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: "Owner not found",
            });
        }

        if (!merchant.profilePitcher) {
            return res.status(400).json({
                success: false,
                message: "No profile pitcher found to remove",
            });
        }

        await deleteCloudinaryImage(merchant.profilePitcher);

        merchant.profilePitcher = "";
        await merchant.save();

        return res.status(200).json({
            success: true,
            message: "Owner profile pitcher removed from database and Cloudinary",
            owner: getPublicOwner(merchant),
        });
    } catch (error) {
        console.error("Remove owner profile pitcher error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default removeOwnerProfilePitcher;
