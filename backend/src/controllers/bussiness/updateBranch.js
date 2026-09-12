import Branch from "../../models/bussiness/branch.js";
import formatBranch from "../../utils/formatBranch.js";
import findBussiness from "../../utils/findBussiness.js";
import findMerchant from "../../utils/findMerchant.js";
import findBranch from "../../utils/findBranch.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";
import toBussinessSlug from "../../utils/toBussinessSlug.js";
import { getSidebarForUser } from "../../constants/sidebarCatalog.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const updateBranch = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "merchantdirectory", "createbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update a branch",
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

        const branch = await findBranch(
            req.params.branchId,
            merchant._id,
            parentBussiness._id
        );

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: "Branch not found for this merchant",
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

        const update = {};

        if (name !== undefined) {
            const trimmedName = String(name).trim();

            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    message: "Branch name is required",
                });
            }

            const nameKey = trimmedName.toLowerCase();
            const slug = toBussinessSlug(trimmedName);

            if (!slug) {
                return res.status(400).json({
                    success: false,
                    message: "Branch name must contain letters or numbers",
                });
            }

            const existingName = await Branch.findOne({
                merchantId: merchant._id,
                _id: { $ne: branch._id },
                $or: [{ nameKey }, { slug }],
            });

            if (existingName) {
                return res.status(409).json({
                    success: false,
                    message: "Branch name already exists for this merchant",
                });
            }

            update.name = trimmedName;
            update.nameKey = nameKey;
            update.slug = slug;
        }

        if (branchCode !== undefined) {
            const normalizedBranchCode = String(branchCode).trim().toUpperCase();

            if (!normalizedBranchCode) {
                return res.status(400).json({
                    success: false,
                    message: "Branch code is required",
                });
            }

            const existingCode = await Branch.findOne({
                merchantId: merchant._id,
                _id: { $ne: branch._id },
                branchCode: normalizedBranchCode,
            });

            if (existingCode) {
                return res.status(409).json({
                    success: false,
                    message: "Branch code already exists for this merchant",
                });
            }

            update.branchCode = normalizedBranchCode;
        }

        if (address !== undefined) {
            const trimmed = String(address).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Address is required",
                });
            }
            update.address = trimmed;
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

        if (email !== undefined) {
            const normalizedEmail = email ? String(email).toLowerCase().trim() : "";

            if (normalizedEmail && !isValidEmail(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid branch email",
                });
            }

            update.email = normalizedEmail;
        }

        if (managerName !== undefined) {
            update.managerName = String(managerName).trim();
        }

        if (managerContact !== undefined) {
            update.managerContact = String(managerContact).trim();
        }

        if (openingTime !== undefined) {
            update.openingTime = String(openingTime).trim();
        }

        if (closingTime !== undefined) {
            update.closingTime = String(closingTime).trim();
        }

        if (latitude !== undefined) {
            update.latitude = String(latitude).trim();
        }

        if (longitude !== undefined) {
            update.longitude = String(longitude).trim();
        }

        if (isActive !== undefined) {
            const nextActive = isActive === true || isActive === "true";

            if (nextActive && merchant.isActive === false) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Cannot activate branch while merchant is inactive. Activate the merchant first",
                });
            }

            update.isActive = nextActive;
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No branch fields provided to update",
            });
        }

        const updatedBranch = await Branch.findByIdAndUpdate(branch._id, update, {
            new: true,
            runValidators: true,
        });

        return res.status(200).json({
            success: true,
            message: "Branch updated successfully",
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
            branch: formatBranch(updatedBranch),
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

        console.error("Update branch error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update branch",
        });
    }
};

export default updateBranch;
