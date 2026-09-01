import mongoose from "mongoose";
import Bussiness from "../../models/bussiness/bussiness.js";
import formatBussiness from "../../utils/formatBussiness.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";
import toBussinessSlug from "../../utils/toBussinessSlug.js";
import { getSidebarForUser } from "../../constants/sidebarCatalog.js";

const findBussiness = async (lookup) => {
    if (!lookup) {
        return null;
    }

    if (mongoose.Types.ObjectId.isValid(lookup)) {
        const byId = await Bussiness.findById(lookup);
        if (byId) {
            return byId;
        }
    }

    return Bussiness.findOne({
        $or: [{ nameKey: lookup.toLowerCase() }, { slug: lookup.toLowerCase() }],
    });
};

const updateBussiness = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "merchantdirectory", "createbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update a business",
            });
        }

        const lookup = req.params.id ? String(req.params.id).trim() : "";
        const bussiness = await findBussiness(lookup);

        if (!bussiness) {
            return res.status(404).json({
                success: false,
                message: "Business not found",
            });
        }

        const { name, description, isActive } = req.body;
        const update = {};

        if (name !== undefined) {
            const trimmedName = String(name).trim();

            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    message: "Business name is required",
                });
            }

            const nameKey = trimmedName.toLowerCase();
            const slug = toBussinessSlug(trimmedName);

            if (!slug) {
                return res.status(400).json({
                    success: false,
                    message: "Business name must contain letters or numbers",
                });
            }

            const existing = await Bussiness.findOne({
                _id: { $ne: bussiness._id },
                $or: [{ nameKey }, { slug }],
            });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: "Business name already exists",
                });
            }

            update.name = trimmedName;
            update.nameKey = nameKey;
            update.slug = slug;
        }

        if (description !== undefined) {
            update.description = String(description).trim();
        }

        if (isActive !== undefined) {
            update.isActive = isActive === true || isActive === "true";
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No business fields provided to update",
            });
        }

        const updatedBussiness = await Bussiness.findByIdAndUpdate(
            bussiness._id,
            update,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Business updated successfully",
            bussiness: formatBussiness(updatedBussiness),
            sidebar: await getSidebarForUser(req.user),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Business name already exists",
            });
        }

        console.error("Update business error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update business",
        });
    }
};

export default updateBussiness;
