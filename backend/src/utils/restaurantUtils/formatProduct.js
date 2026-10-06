import { formatCatalogTags } from "../../constants/restaurantConstant/catalogTags.js";

const formatProduct = (product, category = null) => {
    const tags = formatCatalogTags(product.tags || []);

    return {
        id: product._id,
        merchantId: product.merchantId,
        bussinessId: product.bussinessId,
        branchId: product.branchId || null,
        branchName: Array.isArray(product.branchName)
            ? product.branchName
            : product.branchName
              ? [product.branchName]
              : [],
        showAllBranches: product.showAllBranches === true,
        categoryId: product.categoryId,
        category: category
            ? {
                  id: category._id || category.id,
                  name: category.name,
                  slug: category.slug || "",
                  showAllBranches: category.showAllBranches === true,
              }
            : null,
        name: product.name,
        slug: product.slug || "",
        sku: product.sku || "",
        description: product.description || "",
        image: product.image || "",
        tags,
        costPrice: product.costPrice ?? 0,
        price: product.price ?? 0,
        sellingPrice: product.price ?? 0,
        discountPrice:
            product.discountPrice === undefined || product.discountPrice === null
                ? null
                : product.discountPrice,
        tax: product.tax ?? 0,
        variants: (product.variants || []).map((variant) => ({
            id: variant._id,
            name: variant.name,
            size: variant.size || "",
            portion: variant.portion || "",
            price: variant.price ?? 0,
            discountPrice:
                variant.discountPrice === undefined ||
                variant.discountPrice === null
                    ? null
                    : variant.discountPrice,
            sku: variant.sku || "",
            isActive: variant.isActive !== false,
        })),
        addons: (product.addons || []).map((addon) => ({
            id: addon._id,
            name: addon.name,
            price: addon.price ?? 0,
            isActive: addon.isActive !== false,
            isRequired: addon.isRequired === true,
            maxQuantity: addon.maxQuantity ?? 1,
        })),
        availabilityStatus: product.availabilityStatus || "available",
        availableDays: Array.isArray(product.availableDays)
            ? product.availableDays
            : [],
        availableFrom: product.availableFrom || "",
        availableTo: product.availableTo || "",
        ingredients: (product.ingredients || []).map((item) => ({
            id: item._id,
            name: item.name,
            quantity: item.quantity ?? 0,
            unit: item.unit || "",
        })),
        stockQuantity: product.stockQuantity ?? 0,
        recipe: product.recipe || "",
        calories: product.calories ?? null,
        allergens: Array.isArray(product.allergens) ? product.allergens : [],
        preparationTime: product.preparationTime ?? null,
        notes: product.notes || "",
        isFeatured:
            product.isFeatured === true ||
            tags.some((tag) => tag.key === "featured"),
        isRecommended:
            product.isRecommended === true ||
            tags.some((tag) => tag.key === "recommended"),
        isActive: product.isActive !== false,
        displayOrder: product.displayOrder ?? 0,
        sort: product.displayOrder ?? 0,
        createdBy: product.createdBy || null,
        createdByType: product.createdByType || "owner",
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
};

export default formatProduct;
