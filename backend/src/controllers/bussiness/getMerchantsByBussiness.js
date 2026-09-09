import Merchant from "../../models/bussiness/merchant.js";
import formatMerchant from "../../utils/formatMerchant.js";
import findBussiness from "../../utils/findBussiness.js";
import { hasSidebarPath } from "../../utils/hasSidebarButton.js";
import { attachEffectiveSidebar } from "../../utils/grantSidebarPath.js";

const getMerchantsByBussiness = async (req, res) => {
    try {
        const parentBussiness = await findBussiness(req.params.bussinessId);

        if (!parentBussiness) {
            return res.status(404).json({
                success: false,
                message: "Business category not found",
            });
        }

        const bussinessKey = String(parentBussiness._id);
        await attachEffectiveSidebar(req.user);

        if (!hasSidebarPath(req.user, "viewbussiness", bussinessKey)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view merchants of this business",
            });
        }

        const merchants = await Merchant.find({
            bussinessId: parentBussiness._id,
            isActive: { $ne: false },
        }).sort({ createdAt: -1 });

        const allowedMerchants = merchants.filter((merchant) =>
            hasSidebarPath(
                req.user,
                "viewbussiness",
                bussinessKey,
                String(merchant._id)
            )
        );

        return res.status(200).json({
            success: true,
            message: "Merchants fetched successfully",
            bussiness: {
                id: parentBussiness._id,
                name: parentBussiness.name,
                slug: parentBussiness.slug || "",
                description: parentBussiness.description || "",
            },
            count: allowedMerchants.length,
            merchants: allowedMerchants.map((merchant) => formatMerchant(merchant)),
        });
    } catch (error) {
        console.error("Get merchants error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch merchants",
        });
    }
};

export default getMerchantsByBussiness;
