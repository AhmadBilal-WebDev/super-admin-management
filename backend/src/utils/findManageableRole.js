import LoginSuperAdmin from "../models/auth/login.js";

const findManageableRole = async (req, roleId) => {
    const roleUser = await LoginSuperAdmin.findById(roleId);

    if (!roleUser) {
        return {
            error: {
                status: 404,
                message: "Role not found",
            },
        };
    }

    if (roleUser.accountType !== "role") {
        return {
            error: {
                status: 400,
                message: "This account is not a role. Only created roles can be managed",
            },
        };
    }

    if (String(roleUser._id) === String(req.user._id)) {
        return {
            error: {
                status: 400,
                message: "You cannot manage your own account from role APIs",
            },
        };
    }

    const isOwner = req.user.accountType !== "role";
    const isCreator = String(roleUser.createdBy) === String(req.user._id);

    if (!isOwner && !isCreator) {
        return {
            error: {
                status: 403,
                message: "You are not allowed to manage this role",
            },
        };
    }

    return { roleUser };
};

export default findManageableRole;
