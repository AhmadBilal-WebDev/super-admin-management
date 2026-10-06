import Category from "../../../models/restaurantModels/category.js";
import Product from "../../../models/restaurantModels/product.js";
import toBussinessSlug from "../../../utils/superadminUtils/toBussinessSlug.js";
import formatProduct from "../../../utils/restaurantUtils/formatProduct.js";
import { pushProductToCategory } from "../../../utils/restaurantUtils/syncCategoryProducts.js";
import {
    assertCatalogPermission,
    parseBoolean,
    parseJsonField,
    resolveCatalogWriteScope,
    getMerchantBranchNames,
    normalizeBranchNameList,
} from "../../../utils/restaurantUtils/catalogScope.js";
import {
    normalizeCatalogTags,
    mergeTagsWithFlags,
    syncFlagsFromTags,
} from "../../../constants/restaurantConstant/catalogTags.js";

const VALID_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
];

const normalizeVariants = (raw) => {
    const variants = parseJsonField(raw, []);
    if (!Array.isArray(variants)) throw new Error("Variants must be an array");

    return variants.map((variant) => {
        const name = String(variant?.name || variant?.size || "").trim();
        const price = Number(variant?.price);

        if (!name) throw new Error("Each variant must have a name");
        if (Number.isNaN(price) || price < 0) {
            throw new Error(`Invalid price for variant "${name}"`);
        }

        const discountPrice =
            variant?.discountPrice === undefined ||
            variant?.discountPrice === null ||
            variant?.discountPrice === ""
                ? null
                : Number(variant.discountPrice);

        if (
            discountPrice !== null &&
            (Number.isNaN(discountPrice) || discountPrice < 0)
        ) {
            throw new Error(`Invalid discount price for variant "${name}"`);
        }

        return {
            name,
            size: String(variant?.size || "").trim(),
            portion: String(variant?.portion || "").trim(),
            price,
            discountPrice,
            sku: variant?.sku ? String(variant.sku).trim().toUpperCase() : "",
            isActive: parseBoolean(variant?.isActive, true),
        };
    });
};

const normalizeAddons = (raw) => {
    const addons = parseJsonField(raw, []);
    if (!Array.isArray(addons)) throw new Error("Add-ons must be an array");

    return addons.map((addon) => {
        const name = String(addon?.name || "").trim();
        const price = Number(addon?.price ?? 0);

        if (!name) throw new Error("Each add-on must have a name");
        if (Number.isNaN(price) || price < 0) {
            throw new Error(`Invalid price for add-on "${name}"`);
        }

        return {
            name,
            price,
            isActive: parseBoolean(addon?.isActive, true),
            isRequired: parseBoolean(addon?.isRequired, false),
            maxQuantity: Math.max(1, Number(addon?.maxQuantity) || 1),
        };
    });
};

const normalizeIngredients = (raw) => {
    const ingredients = parseJsonField(raw, []);
    if (!Array.isArray(ingredients)) {
        throw new Error("Ingredients must be an array");
    }

    return ingredients.map((item) => {
        const name = String(item?.name || "").trim();
        if (!name) throw new Error("Each ingredient must have a name");

        return {
            name,
            quantity: Number(item?.quantity) || 0,
            unit: String(item?.unit || "").trim(),
        };
    });
};

const normalizeImageUrl = (raw) => {
    if (raw === undefined || raw === null || raw === "") return "";
    if (Array.isArray(raw)) {
        return String(raw[0] || "").trim();
    }
    return String(raw).trim();
};

const normalizeDays = (raw) => {
    if (raw === undefined || raw === null || raw === "") return [];
    const parsed = parseJsonField(raw, raw);
    const list = Array.isArray(parsed) ? parsed : [parsed];

    return list
        .map((day) => String(day).trim().toLowerCase())
        .filter((day) => VALID_DAYS.includes(day));
};

const normalizeAllergens = (raw) => {
    if (raw === undefined || raw === null || raw === "") return [];
    const parsed = parseJsonField(raw, raw);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map((item) => String(item).trim()).filter(Boolean);
};

const createProduct = async (req, res) => {
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
            "products"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const {
            name,
            categoryId,
            description,
            sku,
            costPrice,
            price,
            sellingPrice,
            discountPrice,
            tax,
            availabilityStatus,
            availableFrom,
            availableTo,
            stockQuantity,
            recipe,
            calories,
            preparationTime,
            notes,
            sort,
            displayOrder,
            slug,
        } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Product name is required",
            });
        }

        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: "Category is required",
            });
        }

        if (!sku || !String(sku).trim()) {
            return res.status(400).json({
                success: false,
                message: "SKU is required",
            });
        }

        const selling = Number(
            sellingPrice !== undefined ? sellingPrice : price
        );

        if (Number.isNaN(selling) || selling < 0) {
            return res.status(400).json({
                success: false,
                message: "Valid selling price is required",
            });
        }

        const category = await Category.findOne({
            _id: categoryId,
            merchantId: scope.owner._id,
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found for this restaurant",
            });
        }

        // Public category: product can be all-branches OR one branch.
        // Branch-specific category: product cannot be all-branches.
        let productShowAll = false;
        let productBranchId = scope.branchId;
        let productBranchName = normalizeBranchNameList(scope.branchName);

        if (category.showAllBranches === true) {
            if (scope.showAllBranches === true) {
                productShowAll = true;
                productBranchId = null;
                productBranchName = await getMerchantBranchNames(
                    scope.owner._id
                );

                if (!productBranchName.length) {
                    productBranchName = normalizeBranchNameList(
                        category.branchName
                    );
                }

                if (productBranchName.length) {
                    await Category.updateOne(
                        { _id: category._id },
                        { $set: { branchName: productBranchName } }
                    );
                }
            } else {
                // Public category + selected branch → product only for that branch
                if (!scope.branchId) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Branch is required when product is not for all branches",
                    });
                }

                productShowAll = false;
                productBranchId = scope.branchId;
                productBranchName = normalizeBranchNameList(scope.branchName);
            }
        } else {
            if (scope.showAllBranches === true) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Category is not enabled for all branches. Product cannot be shown in all branches",
                });
            }

            const categoryVisible =
                String(category.branchId) === String(scope.branchId);

            if (!categoryVisible) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Selected category is not available for this branch",
                });
            }

            productShowAll = false;
            productBranchId = category.branchId;
            productBranchName = normalizeBranchNameList(
                category.branchName?.length
                    ? category.branchName
                    : scope.branchName
            );
        }

        const trimmedName = String(name).trim();
        const normalizedSlug = toBussinessSlug(slug || trimmedName);
        const normalizedSku = String(sku).trim().toUpperCase();

        if (!normalizedSlug) {
            return res.status(400).json({
                success: false,
                message: "Product name must contain letters or numbers",
            });
        }

        const existingSku = await Product.findOne({
            merchantId: scope.owner._id,
            sku: normalizedSku,
            showAllBranches: productShowAll,
            branchId: productBranchId,
        });

        if (existingSku) {
            return res.status(409).json({
                success: false,
                message: "SKU already exists for this branch scope",
            });
        }

        const existingSlug = await Product.findOne({
            merchantId: scope.owner._id,
            slug: normalizedSlug,
            showAllBranches: productShowAll,
            branchId: productBranchId,
        });

        if (existingSlug) {
            return res.status(409).json({
                success: false,
                message: "Product slug already exists for this branch scope",
            });
        }

        let normalizedDiscount = null;
        if (
            discountPrice !== undefined &&
            discountPrice !== null &&
            discountPrice !== ""
        ) {
            normalizedDiscount = Number(discountPrice);
            if (Number.isNaN(normalizedDiscount) || normalizedDiscount < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid discount price",
                });
            }
        }

        const status = String(availabilityStatus || "available")
            .trim()
            .toLowerCase();

        if (!["available", "out_of_stock", "unavailable"].includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Availability status must be available, out_of_stock or unavailable",
            });
        }

        let variants = [];
        let addons = [];
        let ingredients = [];
        let availableDays = [];
        let allergens = [];
        let tags = [];

        try {
            variants = normalizeVariants(req.body.variants);
            addons = normalizeAddons(req.body.addons);
            ingredients = normalizeIngredients(req.body.ingredients);
            availableDays = normalizeDays(req.body.availableDays);
            allergens = normalizeAllergens(req.body.allergens);

            if (req.body.tags !== undefined) {
                tags = normalizeCatalogTags(req.body.tags);
            }
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                message: parseError.message,
            });
        }

        tags = mergeTagsWithFlags({
            tags,
            isFeatured: parseBoolean(req.body.isFeatured, false),
            isRecommended: parseBoolean(req.body.isRecommended, false),
            availabilityStatus: status,
        });
        const synced = syncFlagsFromTags(tags);

        const sortValue =
            sort !== undefined && sort !== ""
                ? Number(sort)
                : displayOrder !== undefined && displayOrder !== ""
                  ? Number(displayOrder)
                  : 0;

        const product = await Product.create({
            merchantId: scope.owner._id,
            bussinessId: scope.owner.bussinessId,
            branchId: productBranchId,
            branchName: productBranchName,
            showAllBranches: productShowAll,
            categoryId: category._id,
            name: trimmedName,
            slug: normalizedSlug,
            sku: normalizedSku,
            description: description ? String(description).trim() : "",
            image: normalizeImageUrl(req.body.image || req.body.img),
            tags,
            costPrice:
                costPrice === undefined || costPrice === ""
                    ? 0
                    : Number(costPrice) || 0,
            price: selling,
            discountPrice: normalizedDiscount,
            tax: tax === undefined || tax === "" ? 0 : Number(tax) || 0,
            variants,
            addons,
            availabilityStatus: synced.availabilityStatus || status,
            availableDays,
            availableFrom: availableFrom ? String(availableFrom).trim() : "",
            availableTo: availableTo ? String(availableTo).trim() : "",
            ingredients,
            stockQuantity:
                stockQuantity === undefined || stockQuantity === ""
                    ? 0
                    : Number(stockQuantity) || 0,
            recipe: recipe ? String(recipe).trim() : "",
            calories:
                calories === undefined || calories === "" || calories === null
                    ? null
                    : Number(calories),
            allergens,
            preparationTime:
                preparationTime === undefined ||
                preparationTime === "" ||
                preparationTime === null
                    ? null
                    : Number(preparationTime),
            notes: notes ? String(notes).trim() : "",
            isFeatured: synced.isFeatured,
            isRecommended: synced.isRecommended,
            isActive: parseBoolean(req.body.isActive, true),
            displayOrder: Number.isNaN(sortValue) ? 0 : sortValue,
            createdBy: scope.actorId,
            createdByType: scope.accountType,
        });

        await pushProductToCategory(category._id, product);

        const updatedCategory = await Category.findById(category._id);

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            frontendDomainUrl: scope.owner.frontendDomainUrl,
            showAllBranches: productShowAll,
            branchName: productBranchName,
            branch: productShowAll
                ? null
                : {
                      id: productBranchId,
                      name: productBranchName[0] || "",
                  },
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

        console.error("Create product error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create product",
        });
    }
};

export default createProduct;
export {
    normalizeVariants,
    normalizeAddons,
    normalizeIngredients,
    normalizeImageUrl,
    normalizeDays,
    normalizeAllergens,
};
