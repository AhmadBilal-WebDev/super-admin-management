import findManageableStaff from "../../../utils/restaurantUtils/findManageableStaff.js";
import getPublicStaff from "../../../utils/restaurantUtils/getPublicStaff.js";

const activateStaffRole = async (req, res) => {
    try {
        const { staff, error } = await findManageableStaff(req, req.params.id);

        if (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message,
            });
        }

        if (staff.isActive !== false) {
            return res.status(400).json({
                success: false,
                message: "Staff role is already active",
            });
        }

        staff.isActive = true;
        await staff.save();

        return res.status(200).json({
            success: true,
            message: "Staff role activated successfully",
            staff: getPublicStaff(staff),
        });
    } catch (error) {
        console.error("Activate staff role error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to activate staff role",
        });
    }
};

export default activateStaffRole;
