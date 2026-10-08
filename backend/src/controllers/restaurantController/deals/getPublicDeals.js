import Deal from "../../../models/restaurantModels/deal.js";
import formatDeal from "../../../utils/restaurantUtils/formatDeal.js";
import findMerchantByDomain from "../../../utils/restaurantUtils/findMerchantByDomain.js";
import {
    resolveBranchForMerchant,
    buildBranchVisibilityFilter,
} from "../../../utils/restaurantUtils/catalogScope.js";

const getPublicDeals = async (req, res) => {
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

        if (req.query.tag) {
            filter.tags = String(req.query.tag).trim().toLowerCase();
        }

        const deals = await Deal.find(filter).sort({
            displayOrder: 1,
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            message: "Deals fetched successfully",
            count: deals.length,
            frontendDomainUrl: merchant.frontendDomainUrl,
            branch: branch
                ? {
                      id: branch._id,
                      name: branch.name,
                      branchCode: branch.branchCode,
                  }
                : null,
            deals: deals.map(formatDeal),
        });
    } catch (error) {
        console.error("Get public deals error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch deals",
        });
    }
};

export default getPublicDeals;
