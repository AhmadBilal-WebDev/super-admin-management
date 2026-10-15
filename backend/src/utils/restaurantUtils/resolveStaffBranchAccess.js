import Branch from "../../models/superadminModels/bussiness/branch.js";
import { parseBoolean } from "./catalogScope.js";

const STAFF_TYPES = {
    STAFF: "staff",
    JUNIOR_OWNER: "junior_owner",
};

const normalizeIdList = (raw) => {
    if (raw === undefined || raw === null || raw === "") return [];

    let list = raw;
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return [];
        if (trimmed.startsWith("[")) {
            try {
                list = JSON.parse(trimmed);
            } catch {
                list = trimmed.split(",");
            }
        } else {
            list = trimmed.split(",");
        }
    }

    if (!Array.isArray(list)) list = [list];

    return [
        ...new Set(
            list
                .map((item) => String(item || "").trim())
                .filter(Boolean)
        ),
    ];
};

const resolveStaffBranchAccess = async (
    owner,
    source = {},
    { actor = null } = {}
) => {
    const actorIsStaff =
        actor &&
        (actor.accountType === "staff" ||
            (actor.merchantId && actor.roleName != null && !actor.ownerEmail));

    const actorHasAllBranches =
        !actorIsStaff || actor.accessAllBranches === true;

    const accessAllBranches = parseBoolean(
        source.accessAllBranches ?? source.showAllBranches,
        false
    );

    if (accessAllBranches) {
        if (!actorHasAllBranches) {
            return {
                error: {
                    status: 403,
                    message:
                        "You cannot grant all-branch access. You only have selected branches",
                },
            };
        }

        const branches = await Branch.find({ merchantId: owner._id })
            .select("_id name")
            .sort({ name: 1 });

        if (!branches.length) {
            return {
                error: {
                    status: 400,
                    message:
                        "No branches found for this restaurant. Add a branch first",
                },
            };
        }

        return {
            accessAllBranches: true,
            branchIds: branches.map((branch) => branch._id),
            branchNames: branches
                .map((branch) => String(branch.name || "").trim())
                .filter(Boolean),
            staffType: STAFF_TYPES.JUNIOR_OWNER,
        };
    }

    const branchIds = normalizeIdList(source.branchIds ?? source.branchId);
    const branchNames = normalizeIdList(
        source.branchNames ?? source.branchName
    );

    if (!branchIds.length && !branchNames.length) {
        return {
            error: {
                status: 400,
                message:
                    "Select at least one branch, or set showAllBranches/accessAllBranches to true",
            },
        };
    }

    const orClauses = [];
    if (branchIds.length) {
        orClauses.push({ _id: { $in: branchIds } });
    }
    if (branchNames.length) {
        orClauses.push(
            ...branchNames.map((name) => ({
                name: new RegExp(
                    `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                    "i"
                ),
            }))
        );
    }

    const branches = await Branch.find({
        merchantId: owner._id,
        $or: orClauses,
    }).select("_id name");

    if (!branches.length) {
        return {
            error: {
                status: 404,
                message: "Selected branch not found for this restaurant",
            },
        };
    }

    if (branchIds.length) {
        const foundIds = new Set(branches.map((b) => String(b._id)));
        const missing = branchIds.filter((id) => !foundIds.has(String(id)));
        if (missing.length) {
            return {
                error: {
                    status: 404,
                    message: `Branch not found: ${missing.join(", ")}`,
                },
            };
        }
    }

    let uniqueBranches = [
        ...new Map(branches.map((b) => [String(b._id), b])).values(),
    ];

    if (actorIsStaff && !actorHasAllBranches) {
        const allowed = new Set(
            (actor.branchIds || []).map((id) => String(id))
        );
        const outside = uniqueBranches.filter(
            (branch) => !allowed.has(String(branch._id))
        );

        if (outside.length) {
            return {
                error: {
                    status: 403,
                    message: `You cannot assign branch(es) outside your access: ${outside
                        .map((b) => b.name)
                        .join(", ")}`,
                },
            };
        }
    }

    return {
        accessAllBranches: false,
        branchIds: uniqueBranches.map((branch) => branch._id),
        branchNames: uniqueBranches
            .map((branch) => String(branch.name || "").trim())
            .filter(Boolean),
        staffType: STAFF_TYPES.STAFF,
    };
};

export { STAFF_TYPES, resolveStaffBranchAccess, normalizeIdList };
export default resolveStaffBranchAccess;
