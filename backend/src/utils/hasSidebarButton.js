import { toPermissionNodes } from "./permissionNode.js";

const hasSidebarPath = (user, ...keys) => {
    const allowed = user?.allowedSidebar || [];

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

const hasSidebarButton = (user, sectionKey, buttonKey) =>
    hasSidebarPath(user, sectionKey, buttonKey);

export { hasSidebarPath };
export default hasSidebarButton;
