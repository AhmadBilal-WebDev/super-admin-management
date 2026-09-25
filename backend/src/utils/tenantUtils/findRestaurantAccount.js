import Merchant from "../../models/superadminModels/bussiness/merchant.js";
import Staff from "../../models/restaurantModels/staff.js";
import { domainsMatch, normalizeDomainUrl } from "./normalizeDomainUrl.js";

const findRestaurantAccount = async (email, frontendDomainUrl, options = {}) => {
    const normalizedEmail = String(email || "").toLowerCase().trim();
    const normalizedDomain = normalizeDomainUrl(frontendDomainUrl);

    if (!normalizedEmail || !normalizedDomain) {
        return {
            error: {
                status: 400,
                message: "Email and frontend domain URL are required",
            },
        };
    }

    let ownerQuery = Merchant.findOne({ ownerEmail: normalizedEmail });
    if (options.withPassword) {
        ownerQuery = ownerQuery.select("+password");
    }

    const merchant = await ownerQuery;

    if (merchant) {
        if (!domainsMatch(merchant.frontendDomainUrl, normalizedDomain)) {
            return {
                error: {
                    status: 403,
                    message: "This email is not registered for this domain",
                },
            };
        }

        if (merchant.isActive === false) {
            return {
                error: {
                    status: 403,
                    message: "This merchant account is inactive. Contact Super Admin",
                },
            };
        }

        return {
            accountType: "owner",
            merchant,
            staff: null,
        };
    }

    let staffQuery = Staff.findOne({ email: normalizedEmail });
    if (options.withPassword) {
        staffQuery = staffQuery.select("+password");
    }

    const staff = await staffQuery;

    if (!staff) {
        return {
            error: {
                status: 404,
                message: "No account found with this email",
            },
        };
    }

    if (staff.isActive === false) {
        return {
            error: {
                status: 403,
                message: "This role account is inactive. Contact Owner",
            },
        };
    }

    const staffMerchant = await Merchant.findById(staff.merchantId);

    if (!staffMerchant || staffMerchant.isActive === false) {
        return {
            error: {
                status: 403,
                message: "Merchant account is inactive",
            },
        };
    }

    if (!domainsMatch(staffMerchant.frontendDomainUrl, normalizedDomain)) {
        return {
            error: {
                status: 403,
                message: "This email is not registered for this domain",
            },
        };
    }

    return {
        accountType: "staff",
        merchant: staffMerchant,
        staff,
    };
};

export default findRestaurantAccount;
