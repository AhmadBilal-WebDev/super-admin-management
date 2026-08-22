import fs from "fs";
import cloudinary from "../../utils/cloudinary.js";
import LoginSuperAdmin from "../../models/auth/login.js";

const uploadProfilePitcher = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Profile pitcher image is required",
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "superadmin/profile-pitcher",
        });

        fs.unlink(req.file.path, () => {});

        const user = await LoginSuperAdmin.findByIdAndUpdate(
            req.user._id,
            { profilePitcher: result.secure_url },
            { new: true }
        ).select("-password");

        return res.status(200).json({
            success: true,
            message: "Profile pitcher uploaded successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePitcher: user.profilePitcher,
            },
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
