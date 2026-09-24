import Merchant from "../../models/superadminModels/bussiness/merchant.js";
import findBussiness from "../../utils/superadminUtils/findBussiness.js";
import toBussinessSlug from "../../utils/superadminUtils/toBussinessSlug.js";
import { normalizeCnic, isValidCnic } from "../../utils/superadminUtils/cnic.js";
import { normalizeDomainUrl } from "../../utils/tenantUtils/normalizeDomainUrl.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidUrl = (url) => {
    try {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        return Boolean(parsed.hostname);
    } catch {
        return false;
    }
};

const formatOwnerProfile = (merchant) => ({
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
});

const updateOwnerProfile = async (req, res) => {
    try {
        if (req.body?.profilePitcher !== undefined) {
            return res.status(400).json({
                success: false,
                message:
                    "Profile pitcher cannot be updated here. Use upload/remove profile pitcher APIs",
            });
        }

        const merchant = await Merchant.findById(req.owner._id);

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: "Owner not found",
            });
        }

        const {
            name,
            description,
            ownerFirstName,
            ownerLastName,
            ownerEmail,
            ownerCnic,
            frontendDomainUrl,
            gender,
            dateOfBirth,
            countryCode,
            contactNumber,
            secondaryContactNumber,
            headAddress,
            country,
            province,
            city,
            district,
            postalCode,
            businessType,
        } = req.body;

        const update = {};

        if (name !== undefined) {
            const trimmedName = String(name).trim();

            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    message: "Merchant name is required",
                });
            }

            const nameKey = trimmedName.toLowerCase();
            const slug = toBussinessSlug(trimmedName);

            if (!slug) {
                return res.status(400).json({
                    success: false,
                    message: "Merchant name must contain letters or numbers",
                });
            }

            const existingName = await Merchant.findOne({
                bussinessId: merchant.bussinessId,
                _id: { $ne: merchant._id },
                $or: [{ nameKey }, { slug }],
            });

            if (existingName) {
                return res.status(409).json({
                    success: false,
                    message: "Merchant name already exists in this business category",
                });
            }

            update.name = trimmedName;
            update.nameKey = nameKey;
            update.slug = slug;
        }

        if (description !== undefined) {
            update.description = String(description).trim();
        }

        if (ownerFirstName !== undefined) {
            const trimmed = String(ownerFirstName).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Owner first name is required",
                });
            }
            update.ownerFirstName = trimmed;
        }

        if (ownerLastName !== undefined) {
            const trimmed = String(ownerLastName).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Owner last name is required",
                });
            }
            update.ownerLastName = trimmed;
        }

        if (ownerEmail !== undefined) {
            const normalizedEmail = String(ownerEmail).toLowerCase().trim();

            if (!isValidEmail(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid owner email",
                });
            }

            const existingEmail = await Merchant.findOne({
                ownerEmail: normalizedEmail,
                _id: { $ne: merchant._id },
            });

            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: "Owner email is already registered for another merchant",
                });
            }

            update.ownerEmail = normalizedEmail;

            if (normalizedEmail !== merchant.ownerEmail) {
                update.isOwnerEmailVerified = false;
            }
        }

        if (ownerCnic !== undefined) {
            const normalizedCnic = normalizeCnic(ownerCnic);

            if (!isValidCnic(normalizedCnic)) {
                return res.status(400).json({
                    success: false,
                    message: "Owner CNIC must be a valid 13-digit number",
                });
            }

            const existingCnic = await Merchant.findOne({
                ownerCnic: normalizedCnic,
                _id: { $ne: merchant._id },
            });

            if (existingCnic) {
                return res.status(409).json({
                    success: false,
                    message: "Owner CNIC is already registered for another merchant",
                });
            }

            update.ownerCnic = normalizedCnic;
        }

        if (frontendDomainUrl !== undefined) {
            const normalizedDomainUrl = normalizeDomainUrl(frontendDomainUrl);

            if (!isValidUrl(normalizedDomainUrl)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid frontend domain URL",
                });
            }

            const existingDomain = await Merchant.findOne({
                frontendDomainUrl: normalizedDomainUrl,
                _id: { $ne: merchant._id },
            });

            if (existingDomain) {
                return res.status(409).json({
                    success: false,
                    message: "Frontend domain URL is already in use",
                });
            }

            update.frontendDomainUrl = normalizedDomainUrl;
        }

        if (gender !== undefined) {
            const normalizedGender = String(gender).toLowerCase().trim();

            if (!["male", "female"].includes(normalizedGender)) {
                return res.status(400).json({
                    success: false,
                    message: "Gender must be male or female",
                });
            }

            update.gender = normalizedGender;
        }

        if (dateOfBirth !== undefined) {
            update.dateOfBirth = dateOfBirth || null;
        }

        if (countryCode !== undefined) {
            const trimmed = String(countryCode).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Country code is required",
                });
            }
            update.countryCode = trimmed;
        }

        if (contactNumber !== undefined) {
            const trimmed = String(contactNumber).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Contact number is required",
                });
            }
            update.contactNumber = trimmed;
        }

        if (secondaryContactNumber !== undefined) {
            update.secondaryContactNumber = String(secondaryContactNumber).trim();
        }

        if (headAddress !== undefined) {
            const trimmed = String(headAddress).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Head address is required",
                });
            }
            update.headAddress = trimmed;
        }

        if (country !== undefined) {
            const trimmed = String(country).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Country is required",
                });
            }
            update.country = trimmed;
        }

        if (province !== undefined) {
            const trimmed = String(province).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Province is required",
                });
            }
            update.province = trimmed;
        }

        if (city !== undefined) {
            const trimmed = String(city).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "City is required",
                });
            }
            update.city = trimmed;
        }

        if (district !== undefined) {
            const trimmed = String(district).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "District is required",
                });
            }
            update.district = trimmed;
        }

        if (postalCode !== undefined) {
            update.postalCode = String(postalCode).trim();
        }

        if (businessType !== undefined) {
            const trimmed = String(businessType).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Business type is required",
                });
            }
            update.businessType = trimmed;
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No profile fields provided to update",
            });
        }

        const updatedMerchant = await Merchant.findByIdAndUpdate(
            merchant._id,
            update,
            { new: true, runValidators: true }
        ).select("-password -otp");

        const parentBussiness = await findBussiness(updatedMerchant.bussinessId);

        return res.status(200).json({
            success: true,
            message: "Owner profile updated successfully",
            profile: formatOwnerProfile(updatedMerchant),
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
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Merchant with this name, email, CNIC, or domain already exists",
            });
        }

        console.error("Update owner profile error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update owner profile",
        });
    }
};

export default updateOwnerProfile;
