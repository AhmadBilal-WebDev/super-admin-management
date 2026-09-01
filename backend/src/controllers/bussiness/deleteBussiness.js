import mongoose from "mongoose";
import Bussiness from "../../models/bussiness/bussiness.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";
import { getSidebarForUser } from "../../constants/sidebarCatalog.js";

const deleteBussiness = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "merchantdirectory", "createbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete a business",
            });
        }

        const { id } = req.params;
        const nameFromBody = req.body?.name ? String(req.body.name).trim() : "";
        const lookup = id ? String(id).trim() : nameFromBody;

        if (!lookup) {
            return res.status(400).json({
                success: false,
                message: "Business id or name is required",
            });
        }

        let bussiness = null;

        if (mongoose.Types.ObjectId.isValid(lookup)) {
            bussiness = await Bussiness.findById(lookup);
        }

        if (!bussiness) {
            bussiness = await Bussiness.findOne({
                nameKey: lookup.toLowerCase(),
            });
        }

        if (!bussiness) {
            return res.status(404).json({
                success: false,
                message: "Business not found",
            });
        }

        await bussiness.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Business deleted successfully",
            // sidebar: await getSidebarForUser(req.user),
        });
    } catch (error) {
        console.error("Delete business error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete business",
        });
    }
};

export default deleteBussiness;
