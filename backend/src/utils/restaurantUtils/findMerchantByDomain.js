import Merchant from "../../models/superadminModels/bussiness/merchant.js";
import {
    domainsMatch,
    getDomainKey,
} from "../tenantUtils/normalizeDomainUrl.js";
import { getFrontendDomainFromRequest } from "./findManageableStaff.js";

const findMerchantByDomain = async (req) => {
    const frontendDomainUrl = getFrontendDomainFromRequest(req);

    if (!frontendDomainUrl) {
        return {
            error: {
                status: 400,
                message: "Frontend domain URL is required",
            },
        };
    }

    const domainKey = getDomainKey(frontendDomainUrl);
    const hostname = String(domainKey || "").split(":")[0];

    if (!hostname) {
        return {
            error: {
                status: 400,
                message: "Invalid frontend domain URL",
            },
        };
    }

    const escaped = hostname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const candidates = await Merchant.find({
        isActive: { $ne: false },
        frontendDomainUrl: { $regex: escaped, $options: "i" },
    });

    const merchant = candidates.find((item) =>
        domainsMatch(item.frontendDomainUrl, frontendDomainUrl)
    );

    if (!merchant) {
        return {
            error: {
                status: 404,
                message: "Restaurant not found for this domain",
            },
        };
    }

    return { merchant, frontendDomainUrl: merchant.frontendDomainUrl };
};

export default findMerchantByDomain;
