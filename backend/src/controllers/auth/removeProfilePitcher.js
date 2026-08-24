import cloudinary from "../../utils/cloudinary.js";
import LoginSuperAdmin from "../../models/auth/login.js";
import getPublicUser from "../../utils/getPublicUser.js";
import getCloudinaryPublicId from "../../utils/getCloudinaryPublicId.js";

const removeProfilePitcher = async (req, res) => {
    try {
        const user = await LoginSuperAdmin.findById(req.user._id);

        if (!user.profilePitcher) {
            return res.status(400).json({
                success: false,
                message: "No profile pitcher found to remove",
            });
        }

        const publicId = getCloudinaryPublicId(user.profilePitcher);

        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }

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
