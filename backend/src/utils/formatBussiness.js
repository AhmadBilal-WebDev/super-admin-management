const formatBussiness = (bussiness) => ({
    id: bussiness._id,
    name: bussiness.name,
    slug: bussiness.slug || "",
    description: bussiness.description || "",
    isActive: bussiness.isActive !== false,
    createdBy: bussiness.createdBy || null,
    createdAt: bussiness.createdAt,
    updatedAt: bussiness.updatedAt,
});

export default formatBussiness;
