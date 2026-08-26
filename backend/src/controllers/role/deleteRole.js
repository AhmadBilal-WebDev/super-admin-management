import cloudinary from "../../utils/cloudinary.js";
import getCloudinaryPublicId from "../../utils/getCloudinaryPublicId.js";
import findManageableRole from "../../utils/findManageableRole.js";

const deleteRole = async (req, res) => {
    try {
        const { roleUser, error } = await findManageableRole(req, req.params.id);

        if (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message,
            });
        }

        const profilePitcher = roleUser.profilePitcher || "";

        await roleUser.deleteOne();

        if (profilePitcher) {
            const publicId = getCloudinaryPublicId(profilePitcher);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.error(
                        "Cloudinary cleanup failed after role delete:",
                        cloudinaryError
                    );
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Role permanently deleted successfully",
        });
    } catch (error) {
        console.error("Delete role error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete role",
        });
    }
};

export default deleteRole;
