import Deal from "../../../models/restaurantModels/deal.js";
import formatDeal from "../../../utils/restaurantUtils/formatDeal.js";
import {
    assertCatalogPermission,
    parseBoolean,
    resolveCatalogListScope,
    buildBranchVisibilityFilter,
} from "../../../utils/restaurantUtils/catalogScope.js";
import { getCatalogTagCatalog } from "../../../constants/restaurantConstant/catalogTags.js";

const getDeals = async (req, res) => {
    try {
        const scope = await resolveCatalogListScope(req);

        if (scope.error) {
            return res.status(scope.error.status).json({
                success: false,
                message: scope.error.message,
            });
        }

        const permissionCheck = assertCatalogPermission(
            scope.account,
            "catalog",
            "dealscombos"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const filter = buildBranchVisibilityFilter({
            merchantId: scope.owner._id,
            branch: scope.branch,
            showAllOnly: scope.showAllOnly,
        });

        if (req.query.isActive !== undefined) {
            filter.isActive = parseBoolean(req.query.isActive, true);
        }

        if (req.query.tag) {
            filter.tags = String(req.query.tag).trim().toLowerCase();
        }

        if (req.query.search && String(req.query.search).trim()) {
            const term = String(req.query.search).trim();
            const searchClause = {
                $or: [
                    { name: { $regex: term, $options: "i" } },
                    { slug: { $regex: term, $options: "i" } },
                    { shortDescription: { $regex: term, $options: "i" } },
                ],
            };

            if (filter.$or) {
                filter.$and = [{ $or: filter.$or }, searchClause];
                delete filter.$or;
            } else {
                Object.assign(filter, searchClause);
            }
        }

        const deals = await Deal.find(filter).sort({
            displayOrder: 1,
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            message: "Deals fetched successfully",
            count: deals.length,
            frontendDomainUrl: scope.owner.frontendDomainUrl,
            branch: scope.branch
                ? {
                      id: scope.branch._id,
                      name: scope.branch.name,
                      branchCode: scope.branch.branchCode,
                  }
                : null,
            // availableTags: getCatalogTagCatalog(),
            deals: deals.map(formatDeal),
        });
    } catch (error) {
        console.error("Get deals error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch deals",
        });
    }
};

export default getDeals;
