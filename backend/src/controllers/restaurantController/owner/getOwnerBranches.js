import Branch from "../../../models/superadminModels/bussiness/branch.js";
import formatBranch from "../../../utils/superadminUtils/formatBranch.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../utils/restaurantUtils/findManageableStaff.js";

const getOwnerBranches = async (req, res) => {
    try {
        const owner = req.owner;

        const domainCheck = assertOwnerDomain(
            owner,
            getFrontendDomainFromRequest(req)
        );

        if (domainCheck.error) {
            return res.status(domainCheck.error.status).json({
                success: false,
                message: domainCheck.error.message,
            });
        }

        const {
            isActive,
            city,
            province,
            country,
            district,
            branchCode,
            search,
        } = req.query;

        const filter = {
            merchantId: owner._id,
        };

        if (isActive !== undefined) {
            if (isActive === "true" || isActive === true) {
                filter.isActive = true;
            } else if (isActive === "false" || isActive === false) {
                filter.isActive = false;
            }
        }

        if (city && String(city).trim()) {
            filter.city = new RegExp(`^${String(city).trim()}$`, "i");
        }

        if (province && String(province).trim()) {
            filter.province = new RegExp(`^${String(province).trim()}$`, "i");
        }

        if (country && String(country).trim()) {
            filter.country = new RegExp(`^${String(country).trim()}$`, "i");
        }

        if (district && String(district).trim()) {
            filter.district = new RegExp(`^${String(district).trim()}$`, "i");
        }

        if (branchCode && String(branchCode).trim()) {
            filter.branchCode = String(branchCode).trim().toUpperCase();
        }

        if (search && String(search).trim()) {
            const term = String(search).trim();
            filter.$or = [
                { name: { $regex: term, $options: "i" } },
                { branchCode: { $regex: term, $options: "i" } },
                { city: { $regex: term, $options: "i" } },
                { address: { $regex: term, $options: "i" } },
            ];
        }

        const branches = await Branch.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Branches fetched successfully",
            count: branches.length,
            frontendDomainUrl: owner.frontendDomainUrl,
            branches: branches.map(formatBranch),
        });
    } catch (error) {
        console.error("Get owner branches error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch branches",
        });
    }
};

export default getOwnerBranches;
