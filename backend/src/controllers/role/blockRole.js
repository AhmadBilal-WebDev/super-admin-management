import getPublicUser from "../../utils/getPublicUser.js";
import findManageableRole from "../../utils/findManageableRole.js";

const blockRole = async (req, res) => {
    try {
        const { roleUser, error } = await findManageableRole(req, req.params.id);

        if (error) {
            return res.status(error.status).json({
                success: false,
                message: error.message,
            });
        }

        if (roleUser.isActive === false) {
            return res.status(400).json({
                success: false,
                message: "Role is already blocked",
            });
        }

        roleUser.isActive = false;
        roleUser.tokenVersion = (roleUser.tokenVersion || 0) + 1;
        await roleUser.save();

        return res.status(200).json({
            success: true,
            message: "Role blocked successfully",
            user: getPublicUser(roleUser),
        });
    } catch (error) {
        console.error("Block role error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to block role",
        });
    }
};

export default blockRole;
