import deleteCloudinaryImage from "../../../utils/superadminUtils/deleteCloudinaryImage.js";
import Merchant from "../../../models/superadminModels/bussiness/merchant.js";
import Staff from "../../../models/restaurantModels/staff.js";
import getPublicOwner from "../../../utils/tenantUtils/getPublicOwner.js";
import getPublicStaff from "../../../utils/restaurantUtils/getPublicStaff.js";
import { getRestaurantActor } from "../../../utils/restaurantUtils/findManageableStaff.js";

const removeOwnerProfilePitcher = async (req, res) => {
    try {
        const { accountType, actorId } = getRestaurantActor(req);

        if (accountType === "staff") {
            const staff = await Staff.findById(actorId);

            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: "Staff not found",
                });
            }

            if (!staff.profilePitcher) {
                return res.status(400).json({
                    success: false,
                    message: "No profile pitcher found to remove",
                });
            }

            await deleteCloudinaryImage(staff.profilePitcher);

            staff.profilePitcher = "";
            await staff.save();

            return res.status(200).json({
                success: true,
                message:
                    "Staff profile pitcher removed from database and Cloudinary",
                accountType: "staff",
                staff: getPublicStaff(staff),
            });
        }

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
            message:
                "Owner profile pitcher removed from database and Cloudinary",
            accountType: "owner",
            owner: getPublicOwner(merchant),
        });
    } catch (error) {
        console.error("Remove profile pitcher error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default removeOwnerProfilePitcher;
