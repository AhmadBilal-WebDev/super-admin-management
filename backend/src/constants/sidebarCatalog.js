import Bussiness from "../models/bussiness/bussiness.js";
import Merchant from "../models/bussiness/merchant.js";
import Branch from "../models/bussiness/branch.js";

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
        key: "merchantdirectory",
        label: "Merchant Directory",
        buttons: [
            { key: "createbussiness", label: "Create Business" },
        ],
    },
    {
        key: "viewbussiness",
        label: "View All Businesses",
        buttons: [],
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

const VIEW_BUSSINESS_PERMISSION = "viewallbussiness";

const toBranchButtons = (branches = []) =>
    branches.map((item) => ({
        key: String(item._id),
        slug: item.slug || "",
        label: item.name,
        branchCode: item.branchCode || "",
        isActive: item.isActive !== false,
    }));

const toMerchantButtons = (merchants = [], branchesByMerchant = new Map()) =>
    merchants.map((item) => ({
        key: String(item._id),
        slug: item.slug || "",
        label: item.name,
        businessType: item.businessType || "",
        buttons: toBranchButtons(branchesByMerchant.get(String(item._id)) || []),
    }));

const toBusinessButtons = (
    businesses = [],
    merchantsByBusiness = new Map(),
    branchesByMerchant = new Map()
) =>
    businesses.map((item) => ({
        key: String(item._id),
        slug: item.slug || "",
        label: item.name,
        description: item.description || "",
        buttons: toMerchantButtons(
            merchantsByBusiness.get(String(item._id)) || [],
            branchesByMerchant
        ),
    }));

const injectBusinessButtons = (
    sidebar,
    businesses = [],
    merchantsByBusiness = new Map(),
    branchesByMerchant = new Map()
) =>
    sidebar.map((item) => {
        if (item.key !== "viewbussiness") {
            return item;
        }

        return {
            ...item,
            buttons: toBusinessButtons(
                businesses,
                merchantsByBusiness,
                branchesByMerchant
            ),
        };
    });

const getFullSidebar = (
    businesses = [],
    merchantsByBusiness = new Map(),
    branchesByMerchant = new Map()
) =>
    injectBusinessButtons(
        sidebarCatalog.map((item) => ({
            key: item.key,
            label: item.label,
            buttons: item.buttons.map((btn) => ({ ...btn })),
        })),
        businesses,
        merchantsByBusiness,
        branchesByMerchant
    );

const getAuthorizedSidebar = (
    user,
    businesses = [],
    merchantsByBusiness = new Map(),
    branchesByMerchant = new Map()
) => {
    const allowed = user.allowedSidebar || [];

    if (!allowed.length) {
        return getFullSidebar(businesses, merchantsByBusiness, branchesByMerchant);
    }

    const allowedMap = new Map(
        allowed.map((item) => [item.key, new Set(item.buttons || [])])
    );

    const sidebar = sidebarCatalog
        .filter((item) => allowedMap.has(item.key))
        .map((item) => {
            if (item.key === "viewbussiness") {
                return {
                    key: item.key,
                    label: item.label,
                    buttons: [],
                };
            }

            return {
                key: item.key,
                label: item.label,
                buttons: item.buttons.filter((btn) =>
                    allowedMap.get(item.key).has(btn.key)
                ),
            };
        })
        .filter((item) => item.key === "viewbussiness" || item.buttons.length > 0);

    return injectBusinessButtons(
        sidebar,
        businesses,
        merchantsByBusiness,
        branchesByMerchant
    );
};

const groupByParentId = (items = [], parentField) => {
    const grouped = new Map();

    for (const item of items) {
        const key = String(item[parentField]);
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key).push(item);
    }

    return grouped;
};

const getSidebarForUser = async (user) => {
    const businesses = await Bussiness.find({ isActive: { $ne: false } })
        .select("name slug description")
        .sort({ createdAt: -1 });

    const merchants = await Merchant.find({ isActive: { $ne: false } })
        .select("name slug businessType bussinessId")
        .sort({ createdAt: -1 });

    const branches = await Branch.find({ isActive: { $ne: false } })
        .select("name slug branchCode merchantId isActive")
        .sort({ createdAt: -1 });

    const merchantsByBusiness = groupByParentId(merchants, "bussinessId");
    const branchesByMerchant = groupByParentId(branches, "merchantId");

    return getAuthorizedSidebar(
        user,
        businesses,
        merchantsByBusiness,
        branchesByMerchant
    );
};

const normalizePermissions = (permissions) => {
    const catalogMap = new Map(sidebarCatalog.map((item) => [item.key, item]));

    return permissions.map((item) => {
        const catalogItem = catalogMap.get(item.key);

        if (!catalogItem) {
            throw new Error(`Invalid sidebar key: ${item.key}`);
        }

        if (item.key === "viewbussiness") {
            return {
                key: catalogItem.key,
                buttons: [VIEW_BUSSINESS_PERMISSION],
            };
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

export {
    sidebarCatalog,
    getFullSidebar,
    getAuthorizedSidebar,
    getSidebarForUser,
    normalizePermissions,
};
