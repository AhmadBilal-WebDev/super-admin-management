import Branch from "../../models/bussiness/branch.js";
import formatBranch from "../../utils/formatBranch.js";
import findBussiness from "../../utils/findBussiness.js";
import findMerchant from "../../utils/findMerchant.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";
import toBussinessSlug from "../../utils/toBussinessSlug.js";
import { getSidebarForUser } from "../../constants/sidebarCatalog.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const addBranch = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "merchantdirectory", "createbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to add a branch",
            });
        }

        const parentBussiness = await findBussiness(req.params.bussinessId);

        if (!parentBussiness) {
            return res.status(404).json({
                success: false,
                message: "Business category not found",
            });
        }

        if (parentBussiness.isActive === false) {
            return res.status(400).json({
                success: false,
                message: "This business category is inactive",
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

        if (merchant.isActive === false) {
            return res.status(400).json({
                success: false,
                message: "This merchant is inactive",
            });
        }

        const {
            name,
            branchCode,
            address,
            country,
            province,
            city,
            district,
            postalCode,
            countryCode,
            contactNumber,
            email,
            managerName,
            managerContact,
            openingTime,
            closingTime,
            latitude,
            longitude,
            isActive,
        } = req.body;

        const requiredFields = {
            name,
            branchCode,
            address,
            country,
            province,
            city,
            district,
            countryCode,
            contactNumber,
        };

        const missingField = Object.entries(requiredFields).find(
            ([, value]) => !value || !String(value).trim()
        );

        if (missingField) {
            return res.status(400).json({
                success: false,
                message: `${missingField[0]} is required`,
            });
        }

        const trimmedName = String(name).trim();
        const normalizedBranchCode = String(branchCode).trim().toUpperCase();
        const nameKey = trimmedName.toLowerCase();
        const slug = toBussinessSlug(trimmedName);

        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Branch name must contain letters or numbers",
            });
        }

        const normalizedEmail = email ? String(email).toLowerCase().trim() : "";

        if (normalizedEmail && !isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch email",
            });
        }

        const existingBranch = await Branch.findOne({
            merchantId: merchant._id,
            $or: [
                { nameKey },
                { slug },
                { branchCode: normalizedBranchCode },
            ],
        });

        if (existingBranch) {
            return res.status(409).json({
                success: false,
                message:
                    "Branch name or branch code already exists for this merchant",
            });
        }

        const branch = await Branch.create({
            bussinessId: parentBussiness._id,
            merchantId: merchant._id,
            name: trimmedName,
            nameKey,
            slug,
            branchCode: normalizedBranchCode,
            address: String(address).trim(),
            country: String(country).trim(),
            province: String(province).trim(),
            city: String(city).trim(),
            district: String(district).trim(),
            postalCode: postalCode ? String(postalCode).trim() : "",
            countryCode: String(countryCode).trim(),
            contactNumber: String(contactNumber).trim(),
            email: normalizedEmail,
            managerName: managerName ? String(managerName).trim() : "",
            managerContact: managerContact ? String(managerContact).trim() : "",
            openingTime: openingTime ? String(openingTime).trim() : "",
            closingTime: closingTime ? String(closingTime).trim() : "",
            latitude: latitude ? String(latitude).trim() : "",
            longitude: longitude ? String(longitude).trim() : "",
            isActive:
                isActive === undefined
                    ? true
                    : isActive === true || isActive === "true",
            createdBy: req.user._id,
        });

        return res.status(201).json({
            success: true,
            message: "Branch added successfully",
            bussiness: {
                id: parentBussiness._id,
                name: parentBussiness.name,
                slug: parentBussiness.slug || "",
            },
            merchant: {
                id: merchant._id,
                name: merchant.name,
                slug: merchant.slug || "",
            },
            branch: formatBranch(branch),
            sidebar: await getSidebarForUser(req.user),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Branch name or branch code already exists for this merchant",
            });
        }

        console.error("Add branch error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to add branch",
        });
    }
};

export default addBranch;
