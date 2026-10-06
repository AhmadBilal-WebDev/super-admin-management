import Category from "../../../models/restaurantModels/category.js";
import Product from "../../../models/restaurantModels/product.js";
import formatProduct from "../../../utils/restaurantUtils/formatProduct.js";
import {
    assertCatalogPermission,
    parseBoolean,
    resolveCatalogListScope,
    buildBranchVisibilityFilter,
} from "../../../utils/restaurantUtils/catalogScope.js";
import { getCatalogTagCatalog } from "../../../constants/restaurantConstant/catalogTags.js";

const getProducts = async (req, res) => {
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
            "products"
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

        if (req.query.categoryId) {
            filter.categoryId = req.query.categoryId;
        }

        if (req.query.isActive !== undefined) {
            filter.isActive = parseBoolean(req.query.isActive, true);
        }

        if (req.query.tag) {
            filter.tags = String(req.query.tag).trim().toLowerCase();
        }

        if (req.query.availabilityStatus) {
            filter.availabilityStatus = String(req.query.availabilityStatus)
                .trim()
                .toLowerCase();
        }

        if (req.query.sku) {
            filter.sku = String(req.query.sku).trim().toUpperCase();
        }

        if (req.query.search && String(req.query.search).trim()) {
            const term = String(req.query.search).trim();
            const searchClause = {
                $or: [
                    { name: { $regex: term, $options: "i" } },
                    { slug: { $regex: term, $options: "i" } },
                    { sku: { $regex: term, $options: "i" } },
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

        const products = await Product.find(filter).sort({
            displayOrder: 1,
            createdAt: -1,
        });

        const categoryIds = [
            ...new Set(products.map((item) => String(item.categoryId))),
        ];
        const categories = await Category.find({
            _id: { $in: categoryIds },
            merchantId: scope.owner._id,
        });
        const categoryMap = new Map(
            categories.map((category) => [String(category._id), category])
        );

        return res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            count: products.length,
            frontendDomainUrl: scope.owner.frontendDomainUrl,
            branch: scope.branch
                ? {
                      id: scope.branch._id,
                      name: scope.branch.name,
                      branchCode: scope.branch.branchCode,
                  }
                : null,
            // availableTags: getCatalogTagCatalog(),
            products: products.map((product) =>
                formatProduct(
                    product,
                    categoryMap.get(String(product.categoryId))
                )
            ),
        });
    } catch (error) {
        console.error("Get products error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch products",
        });
    }
};

export default getProducts;
