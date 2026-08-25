const sidebarCatalog = [
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
        key: "addbussiness",
        label: "+ Add New Business",
        buttons: [
            { key: "addbussiness", label: "Add New Business" },
            { key: "allbussiness", label: "All Businesses" },
        ],
    },
    {
        key: "roles",
        label: "Roles",
        buttons: [
            { key: "all-roles", label: "All Roles" },
            { key: "create-role", label: "Create Role" },
        ],
    },
    {
        key: "settings",
        label: "Settings",
        buttons: [
            { key: "profile", label: "Profile" },
            { key: "security", label: "Security" },
            { key: "notifications", label: "Notifications" },
            { key: "appearance", label: "Appearance" },
            { key: "logout", label: "Logout" },
        ],
    },
];

const getFullSidebar = () =>
    sidebarCatalog.map((item) => ({
        key: item.key,
        label: item.label,
        buttons: item.buttons.map((btn) => ({ ...btn })),
    }));

const getAuthorizedSidebar = (user) => {
    const allowed = user.allowedSidebar || [];

    if (!allowed.length) {
        return getFullSidebar();
    }

    const allowedMap = new Map(
        allowed.map((item) => [item.key, new Set(item.buttons || [])])
    );

    return sidebarCatalog
        .filter((item) => allowedMap.has(item.key))
        .map((item) => ({
            key: item.key,
            label: item.label,
            buttons: item.buttons.filter((btn) =>
                allowedMap.get(item.key).has(btn.key)
            ),
        }))
        .filter((item) => item.buttons.length > 0);
};

const normalizePermissions = (permissions) => {
    const catalogMap = new Map(sidebarCatalog.map((item) => [item.key, item]));

    return permissions.map((item) => {
        const catalogItem = catalogMap.get(item.key);

        if (!catalogItem) {
            throw new Error(`Invalid sidebar key: ${item.key}`);
        }

        const allowedButtons = Array.isArray(item.buttons) ? item.buttons : [];
        const validButtonKeys = new Set(catalogItem.buttons.map((btn) => btn.key));

        const buttons = allowedButtons.filter((btnKey) => {
            if (!validButtonKeys.has(btnKey)) {
                throw new Error(`Invalid button "${btnKey}" for sidebar "${item.key}"`);
            }
            return true;
        });

        if (buttons.length === 0) {
            throw new Error(`Select at least one inner button for "${catalogItem.label}"`);
        }

        return {
            key: catalogItem.key,
            buttons,
        };
    });
};

export { sidebarCatalog, getFullSidebar, getAuthorizedSidebar, normalizePermissions };
