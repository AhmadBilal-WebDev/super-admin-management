import findBussiness from "../../utils/findBussiness.js";
import findMerchant from "../../utils/findMerchant.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";
import { getSidebarForUser } from "../../constants/sidebarCatalog.js";

const deleteMerchant = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "merchantdirectory", "createbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete a merchant",
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

        await merchant.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Merchant deleted successfully",
            bussiness: {
                id: parentBussiness._id,
                name: parentBussiness.name,
                slug: parentBussiness.slug || "",
            },
            sidebar: await getSidebarForUser(req.user),
        });
    } catch (error) {
        console.error("Delete merchant error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete merchant",
        });
    }
};

export default deleteMerchant;
