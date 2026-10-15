import Staff from "../../models/restaurantModels/staff.js";
import { hasRestaurantSidebarPath } from "./hasSidebarButton.js";
import { domainsMatch } from "../tenantUtils/normalizeDomainUrl.js";

const getRestaurantActor = (req) => {
    if (req.accountType === "staff" && req.staff) {
        return {
            accountType: "staff",
            actor: {
                ...(typeof req.staff.toObject === "function"
                    ? req.staff.toObject()
                    : req.staff),
                accountType: "staff",
            },
            actorId: req.staff._id,
            owner: req.owner,
        };
    }

    return {
        accountType: "owner",
        actor: req.owner,
        actorId: req.owner._id,
        owner: req.owner,
    };
};

const canViewAllStaff = (account) =>
    hasRestaurantSidebarPath(
        account,
        "branchmanagement",
        "staffroles",
        "all-staff"
    ) || hasRestaurantSidebarPath(account, "branchmanagement", "staffroles");

const canCreateStaff = (account) =>
    hasRestaurantSidebarPath(
        account,
        "branchmanagement",
        "staffroles",
        "create-staff"
    ) || hasRestaurantSidebarPath(account, "branchmanagement", "staffroles");

const canAccessStaffRoles = (account) =>
    hasRestaurantSidebarPath(account, "branchmanagement", "staffroles") ||
    hasRestaurantSidebarPath(account, "branchmanagement");

const pickRequestValue = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    if (Array.isArray(value)) {
        return pickRequestValue(value[0]);
    }

    return String(value).trim();
};

const getFrontendDomainFromRequest = (req) => {
    const candidates = [
        req.body?.frontendDomainUrl,
        req.body?.frontend_domain_url,
        req.body?.domain,
        req.query?.frontendDomainUrl,
        req.query?.frontend_domain_url,
        req.query?.domain,
        req.headers?.["x-frontend-domain-url"],
        req.headers?.domain,
    ];

    for (const candidate of candidates) {
        const value = pickRequestValue(candidate);
        if (value) {
            return value;
        }
    }

    return "";
};

const assertOwnerDomain = (owner, frontendDomainUrl) => {
    if (!frontendDomainUrl || !String(frontendDomainUrl).trim()) {
        return {
            error: {
                status: 400,
                message: "Frontend domain URL is required",
            },
        };
    }

    if (!domainsMatch(owner.frontendDomainUrl, frontendDomainUrl)) {
        return {
            error: {
                status: 403,
                message: "Frontend domain URL does not match this restaurant",
            },
        };
    }

    return {};
};

const findManageableStaff = async (req, staffId) => {
    const { actor, owner, accountType, actorId } = getRestaurantActor(req);

    if (!canViewAllStaff(actor) && !canAccessStaffRoles(actor)) {
        return {
            error: {
                status: 403,
                message: "You are not allowed to manage staff roles",
            },
        };
    }

    const domainCheck = assertOwnerDomain(
        owner,
        getFrontendDomainFromRequest(req)
    );

    if (domainCheck.error) {
        return domainCheck;
    }

    if (!staffId) {
        return {
            error: {
                status: 400,
                message: "Staff role id is required",
            },
        };
    }

    const staff = await Staff.findOne({
        _id: staffId,
        merchantId: owner._id,
    });

    if (!staff) {
        return {
            error: {
                status: 404,
                message: "Staff role not found for this restaurant",
            },
        };
    }

    // Staff cannot manage themselves via these admin endpoints
    if (accountType === "staff" && String(staff._id) === String(actorId)) {
        return {
            error: {
                status: 403,
                message: "You cannot manage your own staff role here",
            },
        };
    }

    return { staff, owner, actor, accountType, actorId };
};

export {
    canViewAllStaff,
    canCreateStaff,
    canAccessStaffRoles,
    assertOwnerDomain,
    getFrontendDomainFromRequest,
    getRestaurantActor,
};
export default findManageableStaff;
