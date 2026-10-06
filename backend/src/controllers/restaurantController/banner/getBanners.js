import Banner from "../../../models/restaurantModels/banner.js";
import formatBanner from "../../../utils/restaurantUtils/formatBanner.js";
import {
    assertCatalogPermission,
    parseBoolean,
    resolveCatalogListScope,
    buildBranchVisibilityFilter,
} from "../../../utils/restaurantUtils/catalogScope.js";

const getBanners = async (req, res) => {
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
            "marketing",
            "banners"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        // Same as categories:
        // - branchId/branchName → that branch (+ public)
        // - no branch param → all branches
        const filter = buildBranchVisibilityFilter({
            merchantId: scope.owner._id,
            branch: scope.branch,
            showAllOnly: scope.showAllOnly,
        });

        if (req.query.isActive !== undefined) {
            filter.isActive = parseBoolean(req.query.isActive, true);
        }

        if (req.query.search && String(req.query.search).trim()) {
            const term = String(req.query.search).trim();
            const searchClause = {
                $or: [
                    { title: { $regex: term, $options: "i" } },
                    { shortText: { $regex: term, $options: "i" } },
                    { tag: { $regex: term, $options: "i" } },
                ],
            };

            if (filter.$or) {
                filter.$and = [{ $or: filter.$or }, searchClause];
                delete filter.$or;
            } else {
                Object.assign(filter, searchClause);
            }
        }

        const banners = await Banner.find(filter).sort({
            displayOrder: 1,
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            message: "Banners fetched successfully",
            count: banners.length,
            frontendDomainUrl: scope.owner.frontendDomainUrl,
            branch: scope.branch
                ? {
                      id: scope.branch._id,
                      name: scope.branch.name,
                      branchCode: scope.branch.branchCode,
                  }
                : null,
            banners: banners.map(formatBanner),
        });
    } catch (error) {
        console.error("Get banners error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch banners",
        });
    }
};

export default getBanners;
