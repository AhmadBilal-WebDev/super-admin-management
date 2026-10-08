import { formatCatalogTags } from "../../constants/restaurantConstant/catalogTags.js";

const calcDiscountPercent = (originalPrice, dealPrice) => {
    const original = Number(originalPrice);
    const deal = Number(dealPrice);

    if (!original || original <= 0 || Number.isNaN(original) || Number.isNaN(deal)) {
        return 0;
    }

    if (deal >= original) return 0;

    return Math.round(((original - deal) / original) * 100);
};

const formatDeal = (deal) => {
    const tags = formatCatalogTags(deal.tags || []);
    const originalPrice = deal.originalPrice ?? 0;
    const dealPrice = deal.dealPrice ?? 0;
    const discountPercent =
        deal.discountPercent ?? calcDiscountPercent(originalPrice, dealPrice);

    return {
        id: deal._id,
        merchantId: deal.merchantId,
        bussinessId: deal.bussinessId,
        branchId: deal.branchId || null,
        branchName: Array.isArray(deal.branchName)
            ? deal.branchName
            : deal.branchName
              ? [deal.branchName]
              : [],
        showAllBranches: deal.showAllBranches === true,
        name: deal.name,
        slug: deal.slug || "",
        shortDescription: deal.shortDescription || "",
        image: deal.image || "",
        originalPrice,
        dealPrice,
        discountPercent,
        discountLabel: discountPercent > 0 ? `${discountPercent}% OFF` : "",
        tags,
        items: (deal.items || []).map((item) => ({
            id: item._id,
            name: item.name,
            quantity: item.quantity ?? 1,
            productId: item.productId || null,
        })),
        termsAndConditions: deal.termsAndConditions || "",
        displayOrder: deal.displayOrder ?? 0,
        sort: deal.displayOrder ?? 0,
        isActive: deal.isActive !== false,
        startDate: deal.startDate || null,
        endDate: deal.endDate || null,
        createdBy: deal.createdBy || null,
        createdByType: deal.createdByType || "owner",
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
    };
};

export { calcDiscountPercent };
export default formatDeal;
