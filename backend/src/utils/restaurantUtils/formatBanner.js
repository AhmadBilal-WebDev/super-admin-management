const formatBanner = (banner) => ({
    id: banner._id,
    merchantId: banner.merchantId,
    bussinessId: banner.bussinessId,
    branchId: banner.branchId || null,
    branchName: Array.isArray(banner.branchName)
        ? banner.branchName
        : banner.branchName
          ? [banner.branchName]
          : [],
    showAllBranches: banner.showAllBranches === true,
    title: banner.title,
    shortText: banner.shortText || "",
    description: banner.description || "",
    image: banner.image || "",
    tag: banner.tag || "",
    badge: banner.tag || "",
    buttonText: banner.buttonText || "",
    buttonLink: banner.buttonLink || "",
    secondaryButtonText: banner.secondaryButtonText || "",
    secondaryButtonLink: banner.secondaryButtonLink || "",
    displayOrder: banner.displayOrder ?? 0,
    sort: banner.displayOrder ?? 0,
    isActive: banner.isActive !== false,
    startDate: banner.startDate || null,
    endDate: banner.endDate || null,
    createdBy: banner.createdBy || null,
    createdByType: banner.createdByType || "owner",
    createdAt: banner.createdAt,
    updatedAt: banner.updatedAt,
});

export default formatBanner;
