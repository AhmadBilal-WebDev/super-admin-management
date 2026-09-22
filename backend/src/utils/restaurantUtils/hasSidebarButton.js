import { toPermissionNodes } from "./permissionNode.js";

const hasRestaurantSidebarPath = (userOrOwner, ...keys) => {
    const allowed = userOrOwner?.allowedSidebar || [];

    if (!allowed.length) {
        return true;
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

        nodes = node.buttons;
    }

    return true;
};

const hasRestaurantSidebarButton = (userOrOwner, sectionKey, buttonKey) =>
    hasRestaurantSidebarPath(userOrOwner, sectionKey, buttonKey);

export { hasRestaurantSidebarPath };
export default hasRestaurantSidebarButton;
