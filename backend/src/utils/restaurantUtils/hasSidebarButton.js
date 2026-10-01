import { toPermissionNodes } from "./permissionNode.js";

const isStaffAccount = (userOrOwner) => {
    if (!userOrOwner) {
        return false;
    }

    if (userOrOwner.accountType === "staff") {
        return true;
    }

    return Boolean(
        userOrOwner.merchantId &&
            userOrOwner.roleName != null &&
            !userOrOwner.ownerEmail
    );
};

const hasRestaurantSidebarPath = (userOrOwner, ...keys) => {
    const allowed = userOrOwner?.allowedSidebar || [];

    // Owner with empty permissions = full access.
    // Staff with empty permissions = no access.
    if (!allowed.length) {
        return !isStaffAccount(userOrOwner);
    }

    let nodes = toPermissionNodes(allowed);

    for (const key of keys) {
        const node = nodes.find((item) => item.key === String(key));

        if (!node) {
            return false;
        }

        if (node.allowAll) {
            return true;
        }

        nodes = node.buttons || [];
    }

    return true;
};

const hasRestaurantSidebarButton = (userOrOwner, ...keys) =>
    hasRestaurantSidebarPath(userOrOwner, ...keys);

export { hasRestaurantSidebarPath, isStaffAccount };
export default hasRestaurantSidebarButton;
