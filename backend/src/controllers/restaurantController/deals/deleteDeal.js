import Deal from "../../../models/restaurantModels/deal.js";
import deleteCloudinaryImage from "../../../utils/superadminUtils/deleteCloudinaryImage.js";
import formatDeal from "../../../utils/restaurantUtils/formatDeal.js";
import {
    assertCatalogPermission,
    getCatalogActor,
} from "../../../utils/restaurantUtils/catalogScope.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../utils/restaurantUtils/findManageableStaff.js";

const deleteDeal = async (req, res) => {
    try {
        const { account, owner } = getCatalogActor(req);

        const domainCheck = assertOwnerDomain(
            owner,
            getFrontendDomainFromRequest(req)
        );

        if (domainCheck.error) {
            return res.status(domainCheck.error.status).json({
                success: false,
                message: domainCheck.error.message,
            });
        }

        const permissionCheck = assertCatalogPermission(
            account,
            "catalog",
            "dealscombos"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const deal = await Deal.findOne({
            _id: req.params.id,
            merchantId: owner._id,
        });

        if (!deal) {
            return res.status(404).json({
                success: false,
                message: "Deal not found",
            });
        }

        const image = deal.image || "";
        const deleted = formatDeal(deal);

        await deal.deleteOne();

        if (image) {
            try {
                await deleteCloudinaryImage(image);
            } catch (cloudinaryError) {
                console.error(
                    "Cloudinary cleanup failed after deal delete:",
                    cloudinaryError
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Deal deleted successfully",
            deal: deleted,
        });
    } catch (error) {
        console.error("Delete deal error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete deal",
        });
    }
};

export default deleteDeal;
