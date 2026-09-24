import findBussiness from "../../utils/superadminUtils/findBussiness.js";

const getOwnerProfile = async (req, res) => {
    try {
        const merchant = req.owner;

        const parentBussiness = await findBussiness(merchant.bussinessId);

        return res.status(200).json({
            success: true,
            message: "Owner profile fetched successfully",
            profile: {
                id: merchant._id,
                bussinessId: merchant.bussinessId,
                name: merchant.name,
                slug: merchant.slug || "",
                description: merchant.description || "",
                ownerFirstName: merchant.ownerFirstName || "",
                ownerLastName: merchant.ownerLastName || "",
                ownerEmail: merchant.ownerEmail,
                ownerCnic: merchant.ownerCnic || "",
                profilePitcher: merchant.profilePitcher || "",
                frontendDomainUrl: merchant.frontendDomainUrl,
                gender: merchant.gender || "",
                dateOfBirth: merchant.dateOfBirth || null,
                countryCode: merchant.countryCode || "",
                contactNumber: merchant.contactNumber || "",
                secondaryContactNumber: merchant.secondaryContactNumber || "",
                headAddress: merchant.headAddress || "",
                country: merchant.country || "",
                province: merchant.province || "",
                city: merchant.city || "",
                district: merchant.district || "",
                postalCode: merchant.postalCode || "",
                businessType: merchant.businessType || "",
                isActive: merchant.isActive !== false,
                isOwnerEmailVerified: merchant.isOwnerEmailVerified === true,
                isPasswordSet: merchant.isPasswordSet === true,
                allowedSidebar: merchant.allowedSidebar || [],
                createdBy: merchant.createdBy || null,
                createdAt: merchant.createdAt,
                updatedAt: merchant.updatedAt,
            },
            bussiness: parentBussiness
                ? {
                      id: parentBussiness._id,
                      name: parentBussiness.name,
                      slug: parentBussiness.slug || "",
                      description: parentBussiness.description || "",
                  }
                : null,
        });
    } catch (error) {
        console.error("Get owner profile error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch owner profile",
        });
    }
};

export default getOwnerProfile;
