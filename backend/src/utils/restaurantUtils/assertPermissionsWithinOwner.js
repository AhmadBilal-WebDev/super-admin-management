import {
    getRestaurantSidebarForUser,
    normalizeRestaurantPermissions,
} from "../../constants/restaurantConstant/sidebarCatalog.js";

const collectKeys = (nodes = [], keys = new Set()) => {
    for (const node of nodes || []) {
        if (!node) {
            continue;
        }

        const key =
            node.key !== undefined && node.key !== null
                ? String(node.key).trim()
                : "";

        if (key) {
            keys.add(key);
        }

        if (Array.isArray(node.buttons) && node.buttons.length) {
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

export { assertPermissionsWithinOwner, collectKeys };
