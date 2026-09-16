import fs from "fs";
import cloudinary from "../../../utils/superadminUtils/cloudinary.js";
import LoginSuperAdmin from "../../../models/superadminModels/auth/login.js";
import getPublicUser from "../../../utils/superadminUtils/getPublicUser.js";
import deleteCloudinaryImage from "../../../utils/superadminUtils/deleteCloudinaryImage.js";

const uploadProfilePitcher = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Profile pitcher image is required",
            });
        }

        const currentUser = await LoginSuperAdmin.findById(req.user._id);

        if (currentUser?.profilePitcher) {
            await deleteCloudinaryImage(currentUser.profilePitcher);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "superadmin/profile-pitcher",
        });

        fs.unlink(req.file.path, () => {});

        const user = await LoginSuperAdmin.findByIdAndUpdate(
            req.user._id,
            { profilePitcher: result.secure_url },
            { new: true }
        ).select("-password -otp");

        return res.status(200).json({
            success: true,
            message: "Profile pitcher uploaded successfully",
            user: getPublicUser(user),
        });
    } catch (error) {
        if (req.file?.path) {
            fs.unlink(req.file.path, () => {});
        }

        console.error("Upload profile pitcher error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default uploadProfilePitcher;
