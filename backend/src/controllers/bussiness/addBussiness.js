import Bussiness from "../../models/bussiness/bussiness.js";
import formatBussiness from "../../utils/formatBussiness.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";
import toBussinessSlug from "../../utils/toBussinessSlug.js";
import { getSidebarForUser } from "../../constants/sidebarCatalog.js";

const addBussiness = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "merchantdirectory", "createbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to add a business",
            });
        }

        const { name, description } = req.body;
        const trimmedName = name ? String(name).trim() : "";
        const trimmedDescription = description ? String(description).trim() : "";

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
            $or: [{ nameKey }, { slug }],
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Business name already exists",
            });
        }

        const bussiness = await Bussiness.create({
            name: trimmedName,
            nameKey,
            slug,
            description: trimmedDescription,
            isActive: true,
            createdBy: req.user._id,
        });

        return res.status(201).json({
            success: true,
            message: "Business added successfully",
            bussiness: formatBussiness(bussiness),
            sidebar: await getSidebarForUser(req.user),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Business name already exists",
            });
        }

        console.error("Add business error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to add business",
        });
    }
};

export default addBussiness;
