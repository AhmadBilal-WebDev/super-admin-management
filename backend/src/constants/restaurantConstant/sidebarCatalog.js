import {
    toPermissionNodes,
    mergePermissionNodes,
} from "../../utils/restaurantUtils/permissionNode.js";

const restaurantSidebarCatalog = [
    {
        key: "dashboard",
        label: "Dashboard",
        buttons: [
            { key: "overview", label: "Overview" },
            { key: "analytics", label: "Analytics" },
            { key: "reports", label: "Reports" },
        ],
    },
    {
        key: "operations",
        label: "Operations",
        buttons: [
            { key: "poscounter", label: "POS / Counter" },
            { key: "orders", label: "Orders" },
            { key: "kitchendisplay", label: "Kitchen Display" },
            { key: "tablesreservations", label: "Tables & Reservations" },
            { key: "opsdelivery", label: "Delivery" },
        ],
    },
    {
        key: "catalog",
        label: "Catalog",
        buttons: [
            { key: "products", label: "Products" },
            { key: "categories", label: "Categories" },
            { key: "variantsaddons", label: "Variants & Add-ons" },
            { key: "dealscombos", label: "Deals & Combos" },
            { key: "availability", label: "Availability" },
            { key: "inventory", label: "Inventory" },
        ],
    },
    {
        key: "delivery",
        label: "Delivery",
        buttons: [
            { key: "deliveryriders", label: "Delivery Riders" },
            { key: "deliveryzones", label: "Delivery Zones" },
            { key: "branchhours", label: "Branch Hours" },
        ],
    },
    {
        key: "marketing",
        label: "Marketing",
        buttons: [
            { key: "banners", label: "Banners" },
            { key: "couponsdiscounts", label: "Coupons & Discounts" },
            { key: "reviews", label: "Reviews" },
            { key: "subscribers", label: "Subscribers" },
        ],
    },
    {
        key: "customers",
        label: "Customers",
        buttons: [],
    },
    {
        key: "branchmanagement",
        label: "Branch Management",
        buttons: [
            { key: "branches", label: "Branches" },
            {
                key: "staffroles",
                label: "Staff & Roles",
                buttons: [
                    { key: "all-staff", label: "All Staff" },
                    { key: "create-staff", label: "Add Staff" },
                ],
            },
        ],
    },
    {
        key: "finance",
        label: "Finance",
        buttons: [
            { key: "payments", label: "Payments" },
            { key: "expenses", label: "Expenses" },
        ],
    },
    {
        key: "settings",
        label: "Settings",
        buttons: [
            { key: "profile", label: "Profile" },
            { key: "theme", label: "Theme" },
            { key: "support", label: "Support" },
            { key: "security", label: "Security" },
        ],
    },
    { key: "logout", label: "Log Out", buttons: [] },
];

const mapCatalogNode = (item) => ({
    key: item.key,
    label: item.label,
    buttons: (item.buttons || []).map((btn) => mapCatalogNode(btn)),
});

const buildRestaurantSidebarTree = () =>
    restaurantSidebarCatalog.map(mapCatalogNode);

const filterTreeByPermissions = (treeNodes = [], permissionNodes = []) => {
    const permissionMap = new Map(
        toPermissionNodes(permissionNodes).map((node) => [node.key, node])
    );

    return treeNodes
        .map((node) => {
            const permission = permissionMap.get(String(node.key));

            if (!permission) {
                return null;
            }

            const children = node.buttons || [];

            if (permission.allowAll) {
                return { ...node };
            }

            if (!children.length) {
                return { ...node, buttons: [] };
            }

            if (!permission.buttons.length) {
                return null;
            }

            const filteredChildren = filterTreeByPermissions(
                children,
                permission.buttons
            );

            if (!filteredChildren.length) {
                return null;
            }

            return {
                ...node,
                buttons: filteredChildren,
            };
        })
        .filter(Boolean);
};

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

const ensureLogoutButton = (sidebar = []) => {
    if (sidebar.some((node) => String(node.key) === "logout")) {
        return sidebar;
    }

    return [
        ...sidebar,
        { key: "logout", label: "Log Out", buttons: [] },
    ];
};

const getAuthorizedRestaurantSidebar = (userOrOwner, tree = []) => {
    const allowed = userOrOwner?.allowedSidebar || [];

    // Owner with empty permissions = full sidebar.
    // Staff with empty permissions = no sidebar access (except logout).
    if (!allowed.length) {
        if (isStaffAccount(userOrOwner)) {
            return ensureLogoutButton([]);
        }

        return tree;
    }

    return ensureLogoutButton(filterTreeByPermissions(tree, allowed));
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
    isStaffAccount,
};
