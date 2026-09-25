import { toPermissionNodes } from "./permissionNode.js";
import {
    getRestaurantSidebarForUser,
    normalizeRestaurantPermissions,
} from "../../constants/restaurantConstant/sidebarCatalog.js";

const collectKeys = (nodes = [], keys = new Set()) => {
    for (const node of toPermissionNodes(nodes)) {
        keys.add(String(node.key));
        if (node.buttons?.length) {
            collectKeys(node.buttons, keys);
        }
    }
    return keys;
};

const assertPermissionsWithinOwner = (owner, permissions) => {
    const normalized = normalizeRestaurantPermissions(permissions);
    const ownerSidebar = getRestaurantSidebarForUser(owner);
    const ownerKeys = collectKeys(ownerSidebar);
    const assignedKeys = collectKeys(normalized);

    for (const key of assignedKeys) {
        if (!ownerKeys.has(key)) {
            throw new Error(
                `You cannot assign permission "${key}" because it is not in your sidebar`
            );
        }
    }

    return normalized;
};

export { assertPermissionsWithinOwner };
