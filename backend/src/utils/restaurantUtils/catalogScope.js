import Branch from "../../models/superadminModels/bussiness/branch.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "./findManageableStaff.js";
import { hasRestaurantSidebarPath } from "./hasSidebarButton.js";

const parseBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value === "boolean") {
        return value;
    }

    const normalized = String(value).trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
        return true;
    }

    if (["false", "0", "no", "off"].includes(normalized)) {
        return false;
    }

    return fallback;
};

const parseJsonField = (value, fallback = []) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value === "object") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        throw new Error("Invalid JSON format in request body");
    }
};

const getCatalogActor = (req) => {
    if (req.accountType === "staff" && req.staff) {
        return {
            accountType: "staff",
            actorId: req.staff._id,
            account: {
                ...(typeof req.staff.toObject === "function"
                    ? req.staff.toObject()
                    : req.staff),
                accountType: "staff",
            },
            owner: req.owner,
        };
    }

    return {
        accountType: "owner",
        actorId: req.owner._id,
        account: req.owner,
        owner: req.owner,
    };
};

const assertCatalogPermission = (account, ...keys) => {
    if (!hasRestaurantSidebarPath(account, ...keys)) {
        return {
            error: {
                status: 403,
                message: "You are not allowed to manage this catalog section",
            },
        };
    }

    return {};
};

const normalizeBranchNameList = (value) => {
    if (value === undefined || value === null || value === "") return [];

    const list = Array.isArray(value)
        ? value
        : typeof value === "string" && value.includes(",")
          ? value.split(",")
          : [value];

    return [
        ...new Set(
            list
                .map((item) => String(item || "").trim())
                .filter(Boolean)
        ),
    ];
};

const getMerchantBranchNames = async (merchantId) => {
    const branches = await Branch.find({ merchantId })
        .select("name")
        .sort({ name: 1 });

    return branches
        .map((branch) => String(branch.name || "").trim())
        .filter(Boolean);
};

const resolveBranchForMerchant = async (owner, { branchId, branchName } = {}) => {
    if (branchId) {
        const branch = await Branch.findOne({
            _id: branchId,
            merchantId: owner._id,
        });

        if (!branch) {
            return {
                error: {
                    status: 404,
                    message: "Branch not found for this restaurant",
                },
            };
        }

        return { branch };
    }

    const firstName = normalizeBranchNameList(branchName)[0];

    if (firstName) {
        const nameKey = firstName.toLowerCase();
        const branch = await Branch.findOne({
            merchantId: owner._id,
            $or: [
                { nameKey },
                { name: new RegExp(`^${firstName}$`, "i") },
                { branchCode: firstName.toUpperCase() },
            ],
        });

        if (!branch) {
            return {
                error: {
                    status: 404,
                    message: "Branch name not found for this restaurant",
                },
            };
        }

        return { branch };
    }

    return {
        error: {
            status: 400,
            message:
                "Branch id or branch name is required when showAllBranches is false",
        },
    };
};

const resolveCatalogWriteScope = async (req) => {
    const { owner, account, accountType, actorId } = getCatalogActor(req);

    const domainCheck = assertOwnerDomain(
        owner,
        getFrontendDomainFromRequest(req)
    );

    if (domainCheck.error) {
        return domainCheck;
    }

    const showAllBranches = parseBoolean(req.body?.showAllBranches, false);

    if (showAllBranches) {
        const branchNames = await getMerchantBranchNames(owner._id);

        if (!branchNames.length) {
            return {
                error: {
                    status: 400,
                    message:
                        "No branches found for this restaurant. Add a branch first",
                },
            };
        }

        return {
            owner,
            account,
            accountType,
            actorId,
            showAllBranches: true,
            branch: null,
            branchId: null,
            branchName: branchNames,
        };
    }

    const branchResult = await resolveBranchForMerchant(owner, {
        branchId: req.body?.branchId,
        branchName: req.body?.branchName,
    });

    if (branchResult.error) {
        return branchResult;
    }

    if (branchResult.branch.isActive === false) {
        return {
            error: {
                status: 400,
                message: "Cannot add catalog items to an inactive branch",
            },
        };
    }

    return {
        owner,
        account,
        accountType,
        actorId,
        showAllBranches: false,
        branch: branchResult.branch,
        branchId: branchResult.branch._id,
        branchName: normalizeBranchNameList(branchResult.branch.name),
    };
};

const resolveCatalogListScope = async (req) => {
    const { owner, account, accountType, actorId } = getCatalogActor(req);

    const domainCheck = assertOwnerDomain(
        owner,
        getFrontendDomainFromRequest(req)
    );

    if (domainCheck.error) {
        return domainCheck;
    }

    const branchId = req.query?.branchId || req.body?.branchId;
    const branchName = req.query?.branchName || req.body?.branchName;
    const showAllOnlyRaw = req.query?.showAllBranches;

    let showAllOnly = null;
    if (showAllOnlyRaw !== undefined) {
        showAllOnly = parseBoolean(showAllOnlyRaw, null);
    }

    let branch = null;

    if (branchId || branchName) {
        const branchResult = await resolveBranchForMerchant(owner, {
            branchId,
            branchName,
        });

        if (branchResult.error) {
            return branchResult;
        }

        branch = branchResult.branch;
    }

    return {
        owner,
        account,
        accountType,
        actorId,
        branch,
        showAllOnly,
    };
};

const buildBranchVisibilityFilter = ({ merchantId, branch, showAllOnly }) => {
    const filter = { merchantId };

    if (showAllOnly === true) {
        filter.showAllBranches = true;
        return filter;
    }

    if (showAllOnly === false && branch) {
        filter.showAllBranches = false;
        filter.branchId = branch._id;
        return filter;
    }

    if (branch) {
        filter.$or = [
            { showAllBranches: true },
            { showAllBranches: false, branchId: branch._id },
        ];
        return filter;
    }

    return filter;
};

export {
    parseBoolean,
    parseJsonField,
    getCatalogActor,
    assertCatalogPermission,
    normalizeBranchNameList,
    getMerchantBranchNames,
    resolveCatalogWriteScope,
    resolveCatalogListScope,
    buildBranchVisibilityFilter,
};
