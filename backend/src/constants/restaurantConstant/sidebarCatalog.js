import {
    toPermissionNodes,
    mergePermissionNodes,
} from "../../utils/restaurantUtils/permissionNode.js";

const restaurantSidebarCatalog = [
    { key: "dashboard", label: "Dashboard", buttons: [] },
    { key: "counterpanel", label: "Counter Panel", buttons: [] },
    { key: "orders", label: "Orders", buttons: [] },
    { key: "kitchen", label: "Kitchen", buttons: [] },
    { key: "products", label: "Products", buttons: [] },
    { key: "categories", label: "Categories", buttons: [] },
    { key: "dealscombos", label: "Deals & Combos", buttons: [] },
    { key: "deliveryriders", label: "Delivery Riders", buttons: [] },
    { key: "branchtimetable", label: "Branch Timetable", buttons: [] },
    { key: "herobanners", label: "Hero Banners", buttons: [] },
    { key: "customerreviews", label: "Customer Reviews", buttons: [] },
    { key: "subscribers", label: "Subscribers", buttons: [] },
    { key: "branches", label: "Branches", buttons: [] },
    {
        key: "staffroles",
        label: "Staff & Roles",
        buttons: [
            { key: "all-staff", label: "All Staff" },
            { key: "create-staff", label: "Add Staff" },
        ],
    },
    { key: "analytics", label: "Analytics", buttons: [] },
    { key: "reports", label: "Reports", buttons: [] },
    {
        key: "settings",
        label: "Settings",
        buttons: [
            { key: "profile", label: "Profile" },
            { key: "security", label: "Security" },
            { key: "appearance", label: "Appearance" },
        ],
    },
    { key: "logout", label: "Log Out", buttons: [] },
];

const buildRestaurantSidebarTree = () =>
    restaurantSidebarCatalog.map((item) => ({
        key: item.key,
        label: item.label,
        buttons: (item.buttons || []).map((btn) => ({
            ...btn,
            buttons: [],
        })),
    }));

const filterTreeByPermissions = (treeNodes = [], permissionNodes = []) => {
    const permissionMap = new Map(
        toPermissionNodes(permissionNodes).map((node) => [node.key, node])
    );

    return treeNodes
        .filter((node) => permissionMap.has(String(node.key)))
        .map((node) => {
            const permission = permissionMap.get(String(node.key));
            const children = node.buttons || [];

            if (permission.allowAll) {
                return { ...node };
            }

            if (!permission.buttons.length) {
                return { ...node, buttons: [] };
            }

            return {
                ...node,
                buttons: filterTreeByPermissions(children, permission.buttons),
            };
        });
};

const getAuthorizedRestaurantSidebar = (userOrOwner, tree = []) => {
    const allowed = userOrOwner?.allowedSidebar || [];

    if (!allowed.length) {
        return tree;
    }

    return filterTreeByPermissions(tree, allowed);
};

const getFullRestaurantSidebar = () => buildRestaurantSidebarTree();

const getRestaurantSidebarForUser = (userOrOwner) =>
    getAuthorizedRestaurantSidebar(userOrOwner, getFullRestaurantSidebar());

const toStoredPermission = (treeNode, permission) => {
    const stored = { key: treeNode.key, buttons: permission.buttons };

    if (permission.allowAll) {
        stored.allowAll = true;
    }

    return stored;
};

const normalizeAgainstTree = (permissionNodes, treeNodes, parentLabel = "") => {
    const treeMap = new Map(treeNodes.map((node) => [String(node.key), node]));

    return mergePermissionNodes(permissionNodes).map((permission) => {
        const treeNode = treeMap.get(permission.key);

        if (!treeNode) {
            throw new Error(
                parentLabel
                    ? `Invalid button "${permission.key}" inside "${parentLabel}"`
                    : `Invalid sidebar key: ${permission.key}`
            );
        }

        const children = treeNode.buttons || [];

        if (permission.allowAll) {
            return toStoredPermission(treeNode, {
                allowAll: true,
                buttons: [],
            });
        }

        if (!permission.buttons.length) {
            if (children.length) {
                throw new Error(
                    `Select at least one inner button for "${treeNode.label}"`
                );
            }

            return toStoredPermission(treeNode, { buttons: [] });
        }

        if (!children.length) {
            throw new Error(`"${treeNode.label}" has no inner buttons to select`);
        }

        return toStoredPermission(treeNode, {
            buttons: normalizeAgainstTree(
                permission.buttons,
                children,
                treeNode.label
            ),
        });
    });
};

const normalizeRestaurantPermissions = (permissions) => {
    const permissionNodes = toPermissionNodes(permissions);

    if (!permissionNodes.length) {
        throw new Error("Select at least one sidebar permission");
    }

    return normalizeAgainstTree(permissionNodes, getFullRestaurantSidebar());
};

export {
    restaurantSidebarCatalog,
    buildRestaurantSidebarTree,
    getFullRestaurantSidebar,
    getAuthorizedRestaurantSidebar,
    getRestaurantSidebarForUser,
    normalizeRestaurantPermissions,
};
