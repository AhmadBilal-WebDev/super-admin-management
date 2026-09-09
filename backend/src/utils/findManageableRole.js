import LoginSuperAdmin from "../models/auth/login.js";
import hasSidebarButton from "./hasSidebarButton.js";

const canViewAllRoles = (user) => hasSidebarButton(user, "roles", "all-roles");

const canCreateRoles = (user) => hasSidebarButton(user, "roles", "create-role");

const canManageRole = (user, roleUser) => {
    if (!user || !roleUser) {
        return false;
    }

    if (user.accountType !== "role") {
        return true;
    }

    if (String(roleUser.createdBy) === String(user._id)) {
        return true;
    }

    return canViewAllRoles(user);
};

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

    if (!canManageRole(req.user, roleUser)) {
        return {
            error: {
                status: 403,
                message: "You are not allowed to manage this role",
            },
        };
    }

    return { roleUser };
};

export { canViewAllRoles, canCreateRoles, canManageRole };
export default findManageableRole;
