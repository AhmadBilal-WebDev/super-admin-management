import Category from "../../../models/restaurantModels/category.js";
import toBussinessSlug from "../../../utils/superadminUtils/toBussinessSlug.js";
import formatCategory from "../../../utils/restaurantUtils/formatCategory.js";
import {
    assertCatalogPermission,
    parseBoolean,
    resolveCatalogWriteScope,
} from "../../../utils/restaurantUtils/catalogScope.js";
import {
    normalizeCatalogTags,
    mergeTagsWithFlags,
    syncFlagsFromTags,
} from "../../../constants/restaurantConstant/catalogTags.js";

const createCategory = async (req, res) => {
    try {
        const scope = await resolveCatalogWriteScope(req);

        if (scope.error) {
            return res.status(scope.error.status).json({
                success: false,
                message: scope.error.message,
            });
        }

        const permissionCheck = assertCatalogPermission(
            scope.account,
            "catalog",
            "categories"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const {
            name,
            description,
            displayOrder,
            sort,
            slug,
            image,
            tags,
            isActive,
            isFeatured,
        } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        const trimmedName = String(name).trim();
        const normalizedSlug = toBussinessSlug(slug || trimmedName);

        if (!normalizedSlug) {
            return res.status(400).json({
                success: false,
                message: "Category name must contain letters or numbers",
            });
        }

        const existing = await Category.findOne({
            merchantId: scope.owner._id,
            slug: normalizedSlug,
            showAllBranches: scope.showAllBranches,
            branchId: scope.branchId,
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: scope.showAllBranches
                    ? "Category already exists for all branches"
                    : "Category already exists in this branch",
            });
        }

        let normalizedTags = [];

        try {
            if (tags !== undefined) {
                normalizedTags = normalizeCatalogTags(tags);
            }
        } catch (tagError) {
            return res.status(400).json({
                success: false,
                message: tagError.message,
            });
        }

        const featuredFlag = parseBoolean(isFeatured, false);
        normalizedTags = mergeTagsWithFlags({
            tags: normalizedTags,
            isFeatured: featuredFlag,
        });
        const synced = syncFlagsFromTags(normalizedTags);

        const sortValue =
            sort !== undefined && sort !== ""
                ? Number(sort)
                : displayOrder !== undefined && displayOrder !== ""
                  ? Number(displayOrder)
                  : 0;

        const category = await Category.create({
            merchantId: scope.owner._id,
            bussinessId: scope.owner.bussinessId,
            branchId: scope.branchId,
            branchName: scope.branchName,
            showAllBranches: scope.showAllBranches,
            name: trimmedName,
            slug: normalizedSlug,
            description: description ? String(description).trim() : "",
            image: image ? String(image).trim() : "",
            displayOrder: Number.isNaN(sortValue) ? 0 : sortValue,
            isActive: parseBoolean(isActive, true),
            isFeatured: synced.isFeatured,
            tags: normalizedTags,
            createdBy: scope.actorId,
            createdByType: scope.accountType,
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            frontendDomainUrl: scope.owner.frontendDomainUrl,
            branch: scope.branch
                ? {
                      id: scope.branch._id,
                      name: scope.branch.name,
                      branchCode: scope.branch.branchCode,
                  }
                : null,
            branchName: scope.branchName,
            showAllBranches: scope.showAllBranches,
            category: formatCategory(category),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Category already exists for this branch scope",
            });
        }

        console.error("Create category error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create category",
        });
    }
};

export default createCategory;
