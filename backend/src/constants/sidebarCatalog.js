import Bussiness from "../models/bussiness/bussiness.js";
import Merchant from "../models/bussiness/merchant.js";
import Branch from "../models/bussiness/branch.js";
import {
    toPermissionNodes,
    mergePermissionNodes,
} from "../utils/permissionNode.js";
import { getEffectiveAllowedSidebar } from "../utils/grantSidebarPath.js";

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

const toBranchNodes = (branches = []) =>
    branches.map((item) => ({
        key: String(item._id),
        slug: item.slug || "",
        label: item.name,
        branchCode: item.branchCode || "",
        isActive: item.isActive !== false,
        buttons: [],
    }));

const toMerchantNodes = (merchants = [], branchesByMerchant = new Map()) =>
    merchants.map((item) => ({
        key: String(item._id),
        slug: item.slug || "",
        label: item.name,
        businessType: item.businessType || "",
        buttons: toBranchNodes(branchesByMerchant.get(String(item._id)) || []),
    }));

const toBusinessNodes = (
    businesses = [],
    merchantsByBusiness = new Map(),
    branchesByMerchant = new Map()
) =>
    businesses.map((item) => ({
        key: String(item._id),
        slug: item.slug || "",
        label: item.name,
        description: item.description || "",
        buttons: toMerchantNodes(
            merchantsByBusiness.get(String(item._id)) || [],
            branchesByMerchant
        ),
    }));

const buildSidebarTree = (
    businesses = [],
    merchantsByBusiness = new Map(),
    branchesByMerchant = new Map()
) =>
    sidebarCatalog.map((item) => {
        if (item.key === "viewbussiness") {
            return {
                key: item.key,
                label: item.label,
                buttons: toBusinessNodes(
                    businesses,
                    merchantsByBusiness,
                    branchesByMerchant
                ),
            };
        }

        return {
            key: item.key,
            label: item.label,
            buttons: item.buttons.map((btn) => ({ ...btn, buttons: [] })),
        };
    });

const loadSidebarTree = async () => {
    const [businesses, merchants, branches] = await Promise.all([
        Bussiness.find({ isActive: { $ne: false } })
            .select("name slug description")
            .sort({ createdAt: -1 }),
        Merchant.find({ isActive: { $ne: false } })
            .select("name slug businessType bussinessId")
            .sort({ createdAt: -1 }),
        Branch.find({ isActive: { $ne: false } })
            .select("name slug branchCode merchantId isActive")
            .sort({ createdAt: -1 }),
    ]);

    return buildSidebarTree(
        businesses,
        groupByParentId(merchants, "bussinessId"),
        groupByParentId(branches, "merchantId")
    );
};

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

const getAuthorizedSidebar = async (user, tree = []) => {
    const allowed = await getEffectiveAllowedSidebar(user);

    if (user && typeof user === "object") {
        user.effectiveAllowedSidebar = allowed;
    }

    if (!allowed.length) {
        return tree;
    }

    return filterTreeByPermissions(tree, allowed);
};

const getFullSidebar = async () => loadSidebarTree();

const getSidebarForUser = async (user) =>
    getAuthorizedSidebar(user, await loadSidebarTree());

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

const normalizePermissions = async (permissions) => {
    const permissionNodes = toPermissionNodes(permissions);

    if (!permissionNodes.length) {
        throw new Error("Select at least one sidebar permission");
    }

    return normalizeAgainstTree(permissionNodes, await loadSidebarTree());
};

export {
    sidebarCatalog,
    buildSidebarTree,
    loadSidebarTree,
    getFullSidebar,
    getAuthorizedSidebar,
    getSidebarForUser,
    normalizePermissions,
};
