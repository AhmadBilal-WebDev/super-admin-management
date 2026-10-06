import Banner from "../../../models/restaurantModels/banner.js";
import deleteCloudinaryImage from "../../../utils/superadminUtils/deleteCloudinaryImage.js";
import formatBanner from "../../../utils/restaurantUtils/formatBanner.js";
import {
    assertCatalogPermission,
    getCatalogActor,
} from "../../../utils/restaurantUtils/catalogScope.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../utils/restaurantUtils/findManageableStaff.js";

const deleteBanner = async (req, res) => {
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
            "marketing",
            "banners"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const banner = await Banner.findOne({
            _id: req.params.id,
            merchantId: owner._id,
        });

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }

        const image = banner.image || "";
        const deleted = formatBanner(banner);

        await banner.deleteOne();

        if (image) {
            try {
                await deleteCloudinaryImage(image);
            } catch (cloudinaryError) {
                console.error(
                    "Cloudinary cleanup failed after banner delete:",
                    cloudinaryError
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Banner deleted successfully",
            banner: deleted,
        });
    } catch (error) {
        console.error("Delete banner error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete banner",
        });
    }
};

export default deleteBanner;
