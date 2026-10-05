import { formatCatalogTags } from "../../constants/restaurantConstant/catalogTags.js";

const formatCategoryProductNames = (products = []) =>
    (Array.isArray(products) ? products : []).map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku || "",
    }));

const formatCategory = (category, fullProducts = null) => {
    const tags = formatCatalogTags(category.tags || []);
    const productNames = formatCategoryProductNames(category.products || []);

    const formatted = {
        id: category._id,
        merchantId: category.merchantId,
        bussinessId: category.bussinessId,
        branchId: category.branchId || null,
        branchName: category.branchName || "",
        showAllBranches: category.showAllBranches === true,
        name: category.name,
        slug: category.slug || "",
        description: category.description || "",
        image: category.image || "",
        displayOrder: category.displayOrder ?? 0,
        sort: category.displayOrder ?? 0,
        isActive: category.isActive !== false,
        isFeatured:
            category.isFeatured === true ||
            tags.some((tag) => tag.key === "featured"),
        tags,
        products: productNames,
        productsCount: productNames.length,
        createdBy: category.createdBy || null,
        createdByType: category.createdByType || "owner",
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
    };

    if (Array.isArray(fullProducts)) {
        formatted.productDetails = fullProducts;
    }

    return formatted;
};

export default formatCategory;
