import Staff from "../../models/restaurantModels/staff.js";
import hasRestaurantSidebarButton, {
    hasRestaurantSidebarPath,
} from "./hasSidebarButton.js";
import { domainsMatch } from "../tenantUtils/normalizeDomainUrl.js";

const canViewAllStaff = (owner) =>
    hasRestaurantSidebarButton(owner, "staffroles", "all-staff");

const canCreateStaff = (owner) =>
    hasRestaurantSidebarButton(owner, "staffroles", "create-staff");

const canAccessStaffRoles = (owner) =>
    hasRestaurantSidebarPath(owner, "staffroles");

const getFrontendDomainFromRequest = (req) =>
    req.body?.frontendDomainUrl || req.query?.frontendDomainUrl || "";

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
