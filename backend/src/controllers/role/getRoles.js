import LoginSuperAdmin from "../../models/auth/login.js";
import getPublicUser from "../../utils/getPublicUser.js";

const getRoles = async (req, res) => {
    try {
        const filter = { accountType: "role" };

        if (req.user.accountType === "role") {
            filter.createdBy = req.user._id;
        }

        const roles = await LoginSuperAdmin.find(filter)
            .select("-password -otp")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Roles fetched successfully",
            count: roles.length,
            roles: roles.map((role) => getPublicUser(role)),
        });
    } catch (error) {
        console.error("Get roles error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch roles",
        });
    }
};

export default getRoles;
