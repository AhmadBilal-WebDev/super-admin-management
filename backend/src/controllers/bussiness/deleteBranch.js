import findBussiness from "../../utils/findBussiness.js";
import findMerchant from "../../utils/findMerchant.js";
import findBranch from "../../utils/findBranch.js";
import hasSidebarButton from "../../utils/hasSidebarButton.js";
import { getSidebarForUser } from "../../constants/sidebarCatalog.js";

const deleteBranch = async (req, res) => {
    try {
        if (!hasSidebarButton(req.user, "merchantdirectory", "createbussiness")) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete a branch",
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

        const deletedBranch = {
            id: branch._id,
            name: branch.name,
            slug: branch.slug || "",
            branchCode: branch.branchCode,
        };

        await branch.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Branch deleted successfully",
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
            branch: deletedBranch,
            sidebar: await getSidebarForUser(req.user),
        });
    } catch (error) {
        console.error("Delete branch error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete branch",
        });
    }
};

export default deleteBranch;
