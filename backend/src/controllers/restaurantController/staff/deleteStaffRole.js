import findManageableStaff from "../../../utils/restaurantUtils/findManageableStaff.js";
import deleteCloudinaryImage from "../../../utils/superadminUtils/deleteCloudinaryImage.js";

const deleteStaffRole = async (req, res) => {
    try {
        const { staff, error } = await findManageableStaff(req, req.params.id);

        if (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message,
            });
        }

        const profilePitcher = staff.profilePitcher || "";
        const staffEmail = staff.email;

        await staff.deleteOne();

        if (profilePitcher) {
            try {
                await deleteCloudinaryImage(profilePitcher);
            } catch (cloudinaryError) {
                console.error(
                    "Cloudinary cleanup failed after staff role delete:",
                    cloudinaryError
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Staff role permanently deleted successfully",
            email: staffEmail,
        });
    } catch (error) {
        console.error("Delete staff role error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete staff role",
        });
    }
};

export default deleteStaffRole;
