import Merchant from "../../models/bussiness/merchant.js";
import formatMerchant from "../../utils/formatMerchant.js";
import findBussiness from "../../utils/findBussiness.js";
import findMerchant from "../../utils/findMerchant.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";
import toBussinessSlug from "../../utils/toBussinessSlug.js";
import { getSidebarForUser } from "../../constants/sidebarCatalog.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidUrl = (url) => {
    try {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        return Boolean(parsed.hostname);
    } catch {
        return false;
    }
};

const normalizeDomainUrl = (url) => {
    const trimmed = String(url).trim();
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const updateMerchant = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "merchantdirectory", "createbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update a merchant",
            });
        }

        const parentBussiness = await findBussiness(req.params.bussinessId);

        if (!parentBussiness) {
            return res.status(404).json({
                success: false,
                message: "Business category not found",
            });
        }

        const merchant = await findMerchant(
            req.params.merchantId,
            parentBussiness._id
        );

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: "Merchant not found in this business category",
            });
        }

        const {
            name,
            ownerFirstName,
            ownerLastName,
            ownerEmail,
            frontendDomainUrl,
            gender,
            countryCode,
            contactNumber,
            headAddress,
            country,
            province,
            city,
            district,
            businessType,
            isActive,
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

            const existingInCategory = await Merchant.findOne({
                bussinessId: parentBussiness._id,
                _id: { $ne: merchant._id },
                $or: [{ nameKey }, { slug }],
            });

            if (existingInCategory) {
                return res.status(409).json({
                    success: false,
                    message: "Merchant name already exists in this business category",
                });
            }

            update.name = trimmedName;
            update.nameKey = nameKey;
            update.slug = slug;
        }

        if (ownerFirstName !== undefined) {
            update.ownerFirstName = String(ownerFirstName).trim();
        }

        if (ownerLastName !== undefined) {
            update.ownerLastName = String(ownerLastName).trim();
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

        if (countryCode !== undefined) {
            update.countryCode = String(countryCode).trim();
        }

        if (contactNumber !== undefined) {
            update.contactNumber = String(contactNumber).trim();
        }

        if (headAddress !== undefined) {
            update.headAddress = String(headAddress).trim();
        }

        if (country !== undefined) {
            update.country = String(country).trim();
        }

        if (province !== undefined) {
            update.province = String(province).trim();
        }

        if (city !== undefined) {
            update.city = String(city).trim();
        }

        if (district !== undefined) {
            update.district = String(district).trim();
        }

        if (businessType !== undefined) {
            update.businessType = String(businessType).trim();
        }

        if (isActive !== undefined) {
            update.isActive = isActive === true || isActive === "true";
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No merchant fields provided to update",
            });
        }

        const updatedMerchant = await Merchant.findByIdAndUpdate(
            merchant._id,
            update,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Merchant updated successfully",
            bussiness: {
                id: parentBussiness._id,
                name: parentBussiness.name,
                slug: parentBussiness.slug || "",
            },
            merchant: formatMerchant(updatedMerchant),
            sidebar: await getSidebarForUser(req.user),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Merchant with this name, email, or domain already exists",
            });
        }

        console.error("Update merchant error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update merchant",
        });
    }
};

export default updateMerchant;
