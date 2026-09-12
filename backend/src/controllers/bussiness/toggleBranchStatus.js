import formatBranch from "../../utils/formatBranch.js";
import findBussiness from "../../utils/findBussiness.js";
import findMerchant from "../../utils/findMerchant.js";
import findBranch from "../../utils/findBranch.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";
import { getSidebarForUser } from "../../constants/sidebarCatalog.js";

const toggleBranchStatus = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "merchantdirectory", "createbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update branch status",
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

        if (req.body?.isActive === undefined) {
            return res.status(400).json({
                success: false,
                message: "isActive is required (true or false)",
            });
        }

        const isActive =
            req.body.isActive === true || req.body.isActive === "true";

        if (isActive && merchant.isActive === false) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot activate branch while merchant is inactive. Activate the merchant first",
            });
        }

        branch.isActive = isActive;
        await branch.save();

        return res.status(200).json({
            success: true,
            message: isActive
                ? "Branch activated successfully"
                : "Branch deactivated successfully",
            bussiness: {
                id: parentBussiness._id,
                name: parentBussiness.name,
                slug: parentBussiness.slug || "",
            },
            merchant: {
                id: merchant._id,
                name: merchant.name,
                slug: merchant.slug || "",
                isActive: merchant.isActive !== false,
            },
            branch: formatBranch(branch),
            sidebar: await getSidebarForUser(req.user),
        });
    } catch (error) {
        console.error("Toggle branch status error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update branch status",
        });
    }
};

export default toggleBranchStatus;
