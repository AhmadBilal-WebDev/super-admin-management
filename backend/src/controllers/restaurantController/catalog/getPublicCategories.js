import Category from "../../../models/restaurantModels/category.js";
import Product from "../../../models/restaurantModels/product.js";
import formatCategory from "../../../utils/restaurantUtils/formatCategory.js";
import formatProduct from "../../../utils/restaurantUtils/formatProduct.js";
import findMerchantByDomain from "../../../utils/restaurantUtils/findMerchantByDomain.js";
import {
    parseBoolean,
    resolveBranchForMerchant,
    buildBranchVisibilityFilter,
} from "../../../utils/restaurantUtils/catalogScope.js";

const pickValue = (...values) => {
    for (const value of values) {
        if (value === undefined || value === null) continue;
        const text = String(Array.isArray(value) ? value[0] : value).trim();
        if (text) return text;
    }
    return "";
};

/**
 * Public categories — no auth.
 * Requires frontendDomainUrl + branchName (or branchId).
 * Returns: that branch's categories + showAllBranches categories.
 */
const getPublicCategories = async (req, res) => {
    try {
        const merchantResult = await findMerchantByDomain(req);

        if (merchantResult.error) {
            return res.status(merchantResult.error.status).json({
                success: false,
                message: merchantResult.error.message,
            });
        }

        const { merchant } = merchantResult;

        const branchId = pickValue(
            req.body?.branchId,
            req.body?.branch_id,
            req.query?.branchId,
            req.query?.branch_id
        );
        const branchName = pickValue(
            req.body?.branchName,
            req.body?.branch,
            req.query?.branchName,
            req.query?.branch
        );

        if (!branchId && !branchName) {
            return res.status(400).json({
                success: false,
                message: "branchName (or branchId) is required",
            });
        }

        const branchResult = await resolveBranchForMerchant(merchant, {
            branchId: branchId || undefined,
            branchName: branchName || undefined,
        });

        if (branchResult.error) {
            return res.status(branchResult.error.status).json({
                success: false,
                message: branchResult.error.message,
            });
        }

        const branch = branchResult.branch;

        if (branch.isActive === false) {
            return res.status(400).json({
                success: false,
                message: "This branch is inactive",
            });
        }

        // This branch + items allowed on all branches
        const filter = buildBranchVisibilityFilter({
            merchantId: merchant._id,
            branch,
            showAllOnly: false,
        });

        filter.isActive = true;

        const tag = pickValue(req.body?.tag, req.query?.tag);
        if (tag) {
            filter.tags = tag.toLowerCase();
        }

        const search = pickValue(req.body?.search, req.query?.search);
        if (search) {
            const searchClause = {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { slug: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                ],
            };

            if (filter.$or) {
                const branchOr = filter.$or;
                delete filter.$or;
                filter.$and = [{ $or: branchOr }, searchClause];
            } else {
                Object.assign(filter, searchClause);
            }
        }

        const categories = await Category.find(filter).sort({
            displayOrder: 1,
            createdAt: -1,
        });

        const includeProducts = parseBoolean(
            req.body?.includeProducts ?? req.query?.includeProducts,
            true
        );
        let productsByCategory = new Map();

        if (includeProducts && categories.length) {
            const productFilter = buildBranchVisibilityFilter({
                merchantId: merchant._id,
                branch,
                showAllOnly: false,
            });

            productFilter.isActive = true;
            productFilter.categoryId = {
                $in: categories.map((category) => category._id),
            };

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
            frontendDomainUrl: merchant.frontendDomainUrl,
            branch: {
                id: branch._id,
                name: branch.name,
                branchCode: branch.branchCode,
            },
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
        console.error("Get public categories error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch categories",
        });
    }
};

export default getPublicCategories;
