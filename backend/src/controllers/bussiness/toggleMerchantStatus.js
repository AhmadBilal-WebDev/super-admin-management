import Branch from "../../models/bussiness/branch.js";
import formatMerchant from "../../utils/formatMerchant.js";
import findBussiness from "../../utils/findBussiness.js";
import findMerchant from "../../utils/findMerchant.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";
import { getSidebarForUser } from "../../constants/sidebarCatalog.js";

const toggleMerchantStatus = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "merchantdirectory", "createbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update merchant status",
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

        if (req.body?.isActive === undefined) {
            return res.status(400).json({
                success: false,
                message: "isActive is required (true or false)",
            });
        }

        const isActive =
            req.body.isActive === true || req.body.isActive === "true";

        merchant.isActive = isActive;
        await merchant.save();

        let updatedBranches = 0;

        if (!isActive) {
            const result = await Branch.updateMany(
                { merchantId: merchant._id },
                { $set: { isActive: false } }
            );
            updatedBranches = result.modifiedCount || 0;
        }

        return res.status(200).json({
            success: true,
            message: isActive
                ? "Merchant activated successfully"
                : "Merchant deactivated successfully. All branches are now inactive",
            bussiness: {
                id: parentBussiness._id,
                name: parentBussiness.name,
                slug: parentBussiness.slug || "",
            },
            merchant: formatMerchant(merchant),
            updatedBranches,
            sidebar: await getSidebarForUser(req.user),
        });
    } catch (error) {
        console.error("Toggle merchant status error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update merchant status",
        });
    }
};

export default toggleMerchantStatus;
