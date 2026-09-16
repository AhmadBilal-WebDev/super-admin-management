import LoginSuperAdmin from "../../../models/superadminModels/auth/login.js";
import getPublicUser from "../../../utils/superadminUtils/getPublicUser.js";
import deleteCloudinaryImage from "../../../utils/superadminUtils/deleteCloudinaryImage.js";

const removeProfilePitcher = async (req, res) => {
    try {
        const user = await LoginSuperAdmin.findById(req.user._id);

        if (!user.profilePitcher) {
            return res.status(400).json({
                success: false,
                message: "No profile pitcher found to remove",
            });
        }

        await deleteCloudinaryImage(user.profilePitcher);

        user.profilePitcher = "";
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile pitcher removed from database and Cloudinary",
            user: getPublicUser(user),
        });
    } catch (error) {
        console.error("Remove profile pitcher error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default removeProfilePitcher;
