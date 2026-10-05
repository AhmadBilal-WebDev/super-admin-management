import Category from "../../../models/restaurantModels/category.js";
import toBussinessSlug from "../../../utils/superadminUtils/toBussinessSlug.js";
import formatCategory from "../../../utils/restaurantUtils/formatCategory.js";
import {
    assertCatalogPermission,
    parseBoolean,
    getCatalogActor,
    resolveCatalogWriteScope,
} from "../../../utils/restaurantUtils/catalogScope.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../utils/restaurantUtils/findManageableStaff.js";
import {
    normalizeCatalogTags,
    mergeTagsWithFlags,
    syncFlagsFromTags,
} from "../../../constants/restaurantConstant/catalogTags.js";

const updateCategory = async (req, res) => {
    try {
        const { account, owner } = getCatalogActor(req);

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

        const permissionCheck = assertCatalogPermission(
            account,
            "catalog",
            "categories"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const category = await Category.findOne({
            _id: req.params.id,
            merchantId: owner._id,
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const update = {};

        if (req.body.name !== undefined) {
            const trimmedName = String(req.body.name).trim();

            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    message: "Category name is required",
                });
            }

            update.name = trimmedName;

            if (req.body.slug === undefined) {
                update.slug = toBussinessSlug(trimmedName);
            }
        }

        if (req.body.slug !== undefined) {
            const normalizedSlug = toBussinessSlug(req.body.slug);

            if (!normalizedSlug) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category slug",
                });
            }

            update.slug = normalizedSlug;
        }

        if (req.body.description !== undefined) {
            update.description = String(req.body.description).trim();
        }

        if (req.body.image !== undefined) {
            update.image = String(req.body.image || "").trim();
        }

        if (req.body.sort !== undefined || req.body.displayOrder !== undefined) {
            const sortValue =
                req.body.sort !== undefined && req.body.sort !== ""
                    ? Number(req.body.sort)
                    : Number(req.body.displayOrder);
            update.displayOrder = Number.isNaN(sortValue) ? 0 : sortValue;
        }

        if (req.body.isActive !== undefined) {
            update.isActive = parseBoolean(req.body.isActive, category.isActive);
        }

        if (req.body.tags !== undefined) {
            try {
                update.tags = normalizeCatalogTags(req.body.tags);
            } catch (tagError) {
                return res.status(400).json({
                    success: false,
                    message: tagError.message,
                });
            }
        }

        if (req.body.isFeatured !== undefined || req.body.tags !== undefined) {
            const nextTags = mergeTagsWithFlags({
                tags:
                    update.tags !== undefined
                        ? update.tags
                        : category.tags || [],
                isFeatured:
                    req.body.isFeatured !== undefined
                        ? parseBoolean(req.body.isFeatured, category.isFeatured)
                        : undefined,
            });
            update.tags = nextTags;
            update.isFeatured = syncFlagsFromTags(nextTags).isFeatured;
        }

        if (
            req.body.showAllBranches !== undefined ||
            req.body.branchId ||
            req.body.branchName
        ) {
            const scope = await resolveCatalogWriteScope(req);

            if (scope.error) {
                return res.status(scope.error.status).json({
                    success: false,
                    message: scope.error.message,
                });
            }

            update.showAllBranches = scope.showAllBranches;
            update.branchId = scope.branchId;
            update.branchName = scope.branchName;
        }

        const nextSlug = update.slug || category.slug;
        const nextShowAll =
            update.showAllBranches !== undefined
                ? update.showAllBranches
                : category.showAllBranches;
        const nextBranchId =
            update.branchId !== undefined ? update.branchId : category.branchId;

        const duplicate = await Category.findOne({
            merchantId: owner._id,
            slug: nextSlug,
            showAllBranches: nextShowAll,
            branchId: nextBranchId,
            _id: { $ne: category._id },
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "Category already exists for this branch scope",
            });
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No category fields provided to update",
            });
        }

        const updated = await Category.findByIdAndUpdate(category._id, update, {
            new: true,
            runValidators: true,
        });

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: formatCategory(updated),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Category already exists for this branch scope",
            });
        }

        console.error("Update category error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update category",
        });
    }
};

export default updateCategory;
