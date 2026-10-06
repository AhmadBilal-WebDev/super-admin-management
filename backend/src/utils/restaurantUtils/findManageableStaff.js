import Staff from "../../models/restaurantModels/staff.js";
import { hasRestaurantSidebarPath } from "./hasSidebarButton.js";
import { domainsMatch } from "../tenantUtils/normalizeDomainUrl.js";

const canViewAllStaff = (owner) =>
    hasRestaurantSidebarPath(
        owner,
        "branchmanagement",
        "staffroles",
        "all-staff"
    ) || hasRestaurantSidebarPath(owner, "branchmanagement", "staffroles");

const canCreateStaff = (owner) =>
    hasRestaurantSidebarPath(
        owner,
        "branchmanagement",
        "staffroles",
        "create-staff"
    ) || hasRestaurantSidebarPath(owner, "branchmanagement", "staffroles");

const canAccessStaffRoles = (owner) =>
    hasRestaurantSidebarPath(owner, "branchmanagement", "staffroles") ||
    hasRestaurantSidebarPath(owner, "branchmanagement");

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
    const owner = req.owner;

    if (!canViewAllStaff(owner) && !canAccessStaffRoles(owner)) {
        return {
            error: {
                status: 403,
                message: "You are not allowed to manage staff roles",
            },
        };
    }

    const domainCheck = assertOwnerDomain(owner, getFrontendDomainFromRequest(req));

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

    return { staff, owner };
};

export {
    canViewAllStaff,
    canCreateStaff,
    canAccessStaffRoles,
    assertOwnerDomain,
    getFrontendDomainFromRequest,
};
export default findManageableStaff;
