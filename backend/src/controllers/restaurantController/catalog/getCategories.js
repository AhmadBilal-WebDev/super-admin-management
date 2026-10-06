import Category from "../../../models/restaurantModels/category.js";
import Product from "../../../models/restaurantModels/product.js";
import formatCategory from "../../../utils/restaurantUtils/formatCategory.js";
import formatProduct from "../../../utils/restaurantUtils/formatProduct.js";
import {
    assertCatalogPermission,
    parseBoolean,
    resolveCatalogListScope,
    buildBranchVisibilityFilter,
} from "../../../utils/restaurantUtils/catalogScope.js";
import { getCatalogTagCatalog } from "../../../constants/restaurantConstant/catalogTags.js";

const getCategories = async (req, res) => {
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
            "categories"
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
                    { description: { $regex: term, $options: "i" } },
                ],
            };

            if (filter.$or) {
                filter.$and = [{ $or: filter.$or }, searchClause];
                delete filter.$or;
            } else {
                Object.assign(filter, searchClause);
            }
        }

        const categories = await Category.find(filter).sort({
            displayOrder: 1,
            createdAt: -1,
        });

        const includeProducts = parseBoolean(req.query.includeProducts, true);
        let productsByCategory = new Map();

        if (includeProducts && categories.length) {
            const productFilter = buildBranchVisibilityFilter({
                merchantId: scope.owner._id,
                branch: scope.branch,
                showAllOnly: scope.showAllOnly,
            });

            productFilter.categoryId = {
                $in: categories.map((category) => category._id),
            };

            if (req.query.productIsActive !== undefined) {
                productFilter.isActive = parseBoolean(
                    req.query.productIsActive,
                    true
                );
            }

            const products = await Product.find(productFilter).sort({
                displayOrder: 1,
                createdAt: -1,
            });

            productsByCategory = products.reduce((map, product) => {
                const key = String(product.categoryId);
                const list = map.get(key) || [];
                list.push(formatProduct(product));
                map.set(key, list);
                return map;
            }, new Map());
        }

        return res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            count: categories.length,
            frontendDomainUrl: scope.owner.frontendDomainUrl,
            branch: scope.branch
                ? {
                      id: scope.branch._id,
                      name: scope.branch.name,
                      branchCode: scope.branch.branchCode,
                  }
                : null,
            // availableTags: getCatalogTagCatalog(),
            categories: categories.map((category) =>
                formatCategory(
                    category,
                    includeProducts
                        ? productsByCategory.get(String(category._id)) || []
                        : null
                )
            ),
        });
    } catch (error) {
        console.error("Get categories error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch categories",
        });
    }
};

export default getCategories;
