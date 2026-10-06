import Banner from "../../../models/restaurantModels/banner.js";
import formatBanner from "../../../utils/restaurantUtils/formatBanner.js";
import findMerchantByDomain from "../../../utils/restaurantUtils/findMerchantByDomain.js";
import {
    resolveBranchForMerchant,
    buildBranchVisibilityFilter,
} from "../../../utils/restaurantUtils/catalogScope.js";

const getPublicBanners = async (req, res) => {
    try {
        const merchantResult = await findMerchantByDomain(req);

        if (merchantResult.error) {
            return res.status(merchantResult.error.status).json({
                success: false,
                message: merchantResult.error.message,
            });
        }

        const { merchant } = merchantResult;
        const now = new Date();

        const branchId = req.query?.branchId;
        const branchName = req.query?.branchName;
        let branch = null;

        if (branchId || branchName) {
            const branchResult = await resolveBranchForMerchant(merchant, {
                branchId,
                branchName,
            });

            if (branchResult.error) {
                return res.status(branchResult.error.status).json({
                    success: false,
                    message: branchResult.error.message,
                });
            }

            branch = branchResult.branch;
        }

        // Same as categories:
        // - branchId/branchName → that branch (+ public banners)
        // - no branch param → all branches
        const filter = buildBranchVisibilityFilter({
            merchantId: merchant._id,
            branch,
            showAllOnly: !branch,
        });

        filter.isActive = true;
        filter.$and = [
            {
                $or: [{ startDate: null }, { startDate: { $lte: now } }],
            },
            {
                $or: [{ endDate: null }, { endDate: { $gte: now } }],
            },
        ];

        const banners = await Banner.find(filter).sort({
            displayOrder: 1,
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            message: "Banners fetched successfully",
            count: banners.length,
            frontendDomainUrl: merchant.frontendDomainUrl,
            branch: branch
                ? {
                      id: branch._id,
                      name: branch.name,
                      branchCode: branch.branchCode,
                  }
                : null,
            banners: banners.map(formatBanner),
        });
    } catch (error) {
        console.error("Get public banners error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch banners",
        });
    }
};

export default getPublicBanners;
