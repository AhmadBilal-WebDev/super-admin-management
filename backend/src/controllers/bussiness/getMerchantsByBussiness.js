import Merchant from "../../models/bussiness/merchant.js";
import formatMerchant from "../../utils/formatMerchant.js";
import findBussiness from "../../utils/findBussiness.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";

const getMerchantsByBussiness = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "viewbussiness", "viewallbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view merchants",
            });
        }

        const parentBussiness = await findBussiness(req.params.bussinessId);

        if (!parentBussiness) {
            return res.status(404).json({
                success: false,
                message: "Business category not found",
            });
        }

        const merchants = await Merchant.find({
            bussinessId: parentBussiness._id,
            isActive: { $ne: false },
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Merchants fetched successfully",
            bussiness: {
                id: parentBussiness._id,
                name: parentBussiness.name,
                slug: parentBussiness.slug || "",
                description: parentBussiness.description || "",
            },
            count: merchants.length,
            merchants: merchants.map((merchant) => formatMerchant(merchant)),
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
