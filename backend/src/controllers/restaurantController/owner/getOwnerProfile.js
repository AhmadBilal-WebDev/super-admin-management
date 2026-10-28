import findBussiness from "../../../utils/superadminUtils/findBussiness.js";
import { formatCurrencyFields } from "../../../constants/superadminConstants/currencies.js";
import getPublicStaff from "../../../utils/restaurantUtils/getPublicStaff.js";
import { getRestaurantSidebarForUser } from "../../../constants/restaurantConstant/sidebarCatalog.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
    getRestaurantActor,
} from "../../../utils/restaurantUtils/findManageableStaff.js";

const getOwnerProfile = async (req, res) => {
    try {
        const { actor, owner, accountType } = getRestaurantActor(req);

        const domainCheck = assertOwnerDomain(
            owner,
            getFrontendDomainFromRequest(req)
        );

        if (domainCheck.error) {
            return res.status(domainCheck.error.status).json({
                success: false,
                message: domainCheck.error.message,
            });
        }

        const parentBussiness = await findBussiness(owner.bussinessId);

        if (accountType === "staff") {
            return res.status(200).json({
                success: true,
                message: "Staff profile fetched successfully",
                accountType: "staff",
                profile: getPublicStaff(actor),
                sidebar: getRestaurantSidebarForUser(actor),
                merchant: {
                    id: owner._id,
                    name: owner.name,
                    slug: owner.slug || "",
                    frontendDomainUrl: owner.frontendDomainUrl,
                    ...formatCurrencyFields(owner.currency),
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
        }

        return res.status(200).json({
            success: true,
            message: "Owner profile fetched successfully",
            accountType: "owner",
            profile: {
                id: owner._id,
                bussinessId: owner.bussinessId,
                name: owner.name,
                slug: owner.slug || "",
                description: owner.description || "",
                ownerFirstName: owner.ownerFirstName || "",
                ownerLastName: owner.ownerLastName || "",
                ownerEmail: owner.ownerEmail,
                ownerCnic: owner.ownerCnic || "",
                profilePitcher: owner.profilePitcher || "",
                frontendDomainUrl: owner.frontendDomainUrl,
                gender: owner.gender || "",
                dateOfBirth: owner.dateOfBirth || null,
                countryCode: owner.countryCode || "",
                contactNumber: owner.contactNumber || "",
                secondaryContactNumber: owner.secondaryContactNumber || "",
                headAddress: owner.headAddress || "",
                country: owner.country || "",
                province: owner.province || "",
                city: owner.city || "",
                district: owner.district || "",
                postalCode: owner.postalCode || "",
                businessType: owner.businessType || "",
                ...formatCurrencyFields(owner.currency),
                isActive: owner.isActive !== false,
                isOwnerEmailVerified: owner.isOwnerEmailVerified === true,
                isPasswordSet: owner.isPasswordSet === true,
                allowedSidebar: owner.allowedSidebar || [],
                theme: owner.theme === "dark" ? "dark" : "light",
                createdBy: owner.createdBy || null,
                createdAt: owner.createdAt,
                updatedAt: owner.updatedAt,
            },
            sidebar: getRestaurantSidebarForUser(owner),
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
        console.error("Get profile error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch profile",
        });
    }
};

export default getOwnerProfile;
