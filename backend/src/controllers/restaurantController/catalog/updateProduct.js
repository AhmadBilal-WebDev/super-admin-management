import Category from "../../../models/restaurantModels/category.js";
import Product from "../../../models/restaurantModels/product.js";
import toBussinessSlug from "../../../utils/superadminUtils/toBussinessSlug.js";
import formatProduct from "../../../utils/restaurantUtils/formatProduct.js";
import { moveProductBetweenCategories } from "../../../utils/restaurantUtils/syncCategoryProducts.js";
import {
    assertCatalogPermission,
    parseBoolean,
    getCatalogActor,
    getMerchantBranchNames,
    normalizeBranchNameList,
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
import {
    normalizeVariants,
    normalizeAddons,
    normalizeIngredients,
    normalizeImageUrl,
    normalizeDays,
    normalizeAllergens,
} from "./createProduct.js";

const updateProduct = async (req, res) => {
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
            "products"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const product = await Product.findOne({
            _id: req.params.id,
            merchantId: owner._id,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const update = {};
        let category = await Category.findById(product.categoryId);

        if (req.body.categoryId !== undefined) {
            const nextCategory = await Category.findOne({
                _id: req.body.categoryId,
                merchantId: owner._id,
            });

            if (!nextCategory) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found for this restaurant",
                });
            }

            const categoryIsPublic = nextCategory.showAllBranches === true;

            if (!categoryIsPublic) {
                if (
                    product.showAllBranches === true ||
                    parseBoolean(req.body.showAllBranches, false)
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Category is not enabled for all branches. Product cannot be shown in all branches",
                    });
                }

                update.showAllBranches = false;
                update.branchId = nextCategory.branchId;
                update.branchName = normalizeBranchNameList(
                    nextCategory.branchName
                );
            }
            // Public category: keep current product branch scope unless body changes it

            update.categoryId = nextCategory._id;
            category = nextCategory;
        }

        if (
            req.body.showAllBranches !== undefined &&
            update.showAllBranches === undefined
        ) {
            const wantsAll = parseBoolean(req.body.showAllBranches, false);
            const parent =
                category || (await Category.findById(product.categoryId));

            if (wantsAll && parent?.showAllBranches !== true) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Category is not enabled for all branches. Product cannot be shown in all branches",
                });
            }

            if (wantsAll) {
                const branchNames = await getMerchantBranchNames(owner._id);
                update.showAllBranches = true;
                update.branchId = null;
                update.branchName = branchNames;
            } else {
                const previousShowAll = req.body.showAllBranches;
                req.body.showAllBranches = false;
                const scope = await resolveCatalogWriteScope(req);
                req.body.showAllBranches = previousShowAll;

                if (scope.error) {
                    return res.status(scope.error.status).json({
                        success: false,
                        message: scope.error.message,
                    });
                }

                update.showAllBranches = false;
                update.branchId = scope.branchId;
                update.branchName = normalizeBranchNameList(scope.branchName);
            }
        }

        if (req.body.name !== undefined) {
            const trimmedName = String(req.body.name).trim();

            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    message: "Product name is required",
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
                    message: "Invalid product slug",
                });
            }

            update.slug = normalizedSlug;
        }

        if (req.body.sku !== undefined) {
            const normalizedSku = String(req.body.sku).trim().toUpperCase();

            if (!normalizedSku) {
                return res.status(400).json({
                    success: false,
                    message: "SKU is required",
                });
            }

            update.sku = normalizedSku;
        }

        if (req.body.description !== undefined) {
            update.description = String(req.body.description || "").trim();
        }

        if (
            req.body.price !== undefined ||
            req.body.sellingPrice !== undefined
        ) {
            const selling = Number(
                req.body.sellingPrice !== undefined
                    ? req.body.sellingPrice
                    : req.body.price
            );

            if (Number.isNaN(selling) || selling < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Valid selling price is required",
                });
            }

            update.price = selling;
        }

        if (req.body.costPrice !== undefined) {
            update.costPrice =
                req.body.costPrice === "" ? 0 : Number(req.body.costPrice) || 0;
        }

        if (req.body.discountPrice !== undefined) {
            if (
                req.body.discountPrice === null ||
                req.body.discountPrice === ""
            ) {
                update.discountPrice = null;
            } else {
                const discount = Number(req.body.discountPrice);
                if (Number.isNaN(discount) || discount < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid discount price",
                    });
                }
                update.discountPrice = discount;
            }
        }

        if (req.body.tax !== undefined) {
            update.tax =
                req.body.tax === "" ? 0 : Number(req.body.tax) || 0;
        }

        if (req.body.availabilityStatus !== undefined) {
            const status = String(req.body.availabilityStatus)
                .trim()
                .toLowerCase();

            if (
                !["available", "out_of_stock", "unavailable"].includes(status)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Availability status must be available, out_of_stock or unavailable",
                });
            }

            update.availabilityStatus = status;
        }

        if (req.body.availableFrom !== undefined) {
            update.availableFrom = String(req.body.availableFrom || "").trim();
        }

        if (req.body.availableTo !== undefined) {
            update.availableTo = String(req.body.availableTo || "").trim();
        }

        if (req.body.stockQuantity !== undefined) {
            update.stockQuantity =
                req.body.stockQuantity === ""
                    ? 0
                    : Number(req.body.stockQuantity) || 0;
        }

        if (req.body.recipe !== undefined) {
            update.recipe = String(req.body.recipe || "").trim();
        }

        if (req.body.calories !== undefined) {
            update.calories =
                req.body.calories === "" || req.body.calories === null
                    ? null
                    : Number(req.body.calories);
        }

        if (req.body.preparationTime !== undefined) {
            update.preparationTime =
                req.body.preparationTime === "" ||
                req.body.preparationTime === null
                    ? null
                    : Number(req.body.preparationTime);
        }

        if (req.body.notes !== undefined) {
            update.notes = String(req.body.notes || "").trim();
        }

        if (req.body.isActive !== undefined) {
            update.isActive = parseBoolean(req.body.isActive, product.isActive);
        }

        if (
            req.body.sort !== undefined ||
            req.body.displayOrder !== undefined
        ) {
            const sortValue = Number(
                req.body.sort !== undefined
                    ? req.body.sort
                    : req.body.displayOrder
            );
            update.displayOrder = Number.isNaN(sortValue) ? 0 : sortValue;
        }

        try {
            if (req.body.variants !== undefined) {
                update.variants = normalizeVariants(req.body.variants);
            }
            if (req.body.addons !== undefined) {
                update.addons = normalizeAddons(req.body.addons);
            }
            if (req.body.ingredients !== undefined) {
                update.ingredients = normalizeIngredients(req.body.ingredients);
            }
            if (req.body.image !== undefined || req.body.img !== undefined) {
                update.image = normalizeImageUrl(
                    req.body.image !== undefined ? req.body.image : req.body.img
                );
            }
            if (req.body.availableDays !== undefined) {
                update.availableDays = normalizeDays(req.body.availableDays);
            }
            if (req.body.allergens !== undefined) {
                update.allergens = normalizeAllergens(req.body.allergens);
            }
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                message: parseError.message,
            });
        }

        const nextTags =
            req.body.tags !== undefined
                ? normalizeCatalogTags(req.body.tags)
                : product.tags || [];

        const tags = mergeTagsWithFlags({
            tags: nextTags,
            isFeatured:
                req.body.isFeatured !== undefined
                    ? parseBoolean(req.body.isFeatured, false)
                    : product.isFeatured,
            isRecommended:
                req.body.isRecommended !== undefined
                    ? parseBoolean(req.body.isRecommended, false)
                    : product.isRecommended,
            availabilityStatus:
                update.availabilityStatus || product.availabilityStatus,
        });
        const synced = syncFlagsFromTags(tags);

        update.tags = tags;
        update.isFeatured = synced.isFeatured;
        update.isRecommended = synced.isRecommended;
        if (synced.availabilityStatus) {
            update.availabilityStatus = synced.availabilityStatus;
        }

        const nextSku = update.sku || product.sku;
        const nextSlug = update.slug || product.slug;
        const nextShowAll =
            update.showAllBranches !== undefined
                ? update.showAllBranches
                : product.showAllBranches;
        const nextBranchId =
            update.branchId !== undefined ? update.branchId : product.branchId;

        if (update.sku !== undefined || update.showAllBranches !== undefined) {
            const existingSku = await Product.findOne({
                _id: { $ne: product._id },
                merchantId: owner._id,
                sku: nextSku,
                showAllBranches: nextShowAll,
                branchId: nextBranchId,
            });

            if (existingSku) {
                return res.status(409).json({
                    success: false,
                    message: "SKU already exists for this branch scope",
                });
            }
        }

        if (update.slug !== undefined || update.showAllBranches !== undefined) {
            const existingSlug = await Product.findOne({
                _id: { $ne: product._id },
                merchantId: owner._id,
                slug: nextSlug,
                showAllBranches: nextShowAll,
                branchId: nextBranchId,
            });

            if (existingSlug) {
                return res.status(409).json({
                    success: false,
                    message: "Product slug already exists for this branch scope",
                });
            }
        }

        const previousCategoryId = product.categoryId;

        Object.assign(product, update);
        await product.save();

        await moveProductBetweenCategories({
            fromCategoryId: previousCategoryId,
            toCategoryId: product.categoryId,
            product,
        });

        const updatedCategory = await Category.findById(product.categoryId);

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            frontendDomainUrl: owner.frontendDomainUrl,
            categoryProducts: (updatedCategory?.products || []).map((item) => ({
                productId: item.productId,
                name: item.name,
                sku: item.sku || "",
            })),
            product: formatProduct(product, updatedCategory || category),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Product SKU or slug already exists for this branch scope",
            });
        }

        console.error("Update product error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update product",
        });
    }
};

export default updateProduct;
