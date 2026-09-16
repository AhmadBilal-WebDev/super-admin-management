import Merchant from "../../models/superadminModels/bussiness/merchant.js";
import { domainsMatch, normalizeDomainUrl } from "./normalizeDomainUrl.js";

const findOwnerMerchant = async (email, frontendDomainUrl, options = {}) => {
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

    let query = Merchant.findOne({ ownerEmail: normalizedEmail });

    if (options.withPassword) {
        query = query.select("+password");
    }

    const merchant = await query;

    if (!merchant) {
        return {
            error: {
                status: 404,
                message: "No owner account found with this email",
            },
        };
    }

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

    return { merchant };
};

export default findOwnerMerchant;
