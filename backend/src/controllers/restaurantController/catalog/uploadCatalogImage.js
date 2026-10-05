import {
    getCatalogActor,
    assertCatalogPermission,
} from "../../../utils/restaurantUtils/catalogScope.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../utils/restaurantUtils/findManageableStaff.js";
import {
    getSingleUploadedFile,
    uploadImageToCloudinary,
    cleanupUploadedFile,
} from "../../../utils/restaurantUtils/uploadCatalogImage.js";

const uploadCatalogImage = async (req, res) => {
    const uploadedFile = getSingleUploadedFile(req);

    try {
        const { account, owner } = getCatalogActor(req);

        const domainCheck = assertOwnerDomain(
            owner,
            getFrontendDomainFromRequest(req)
        );

        if (domainCheck.error) {
            cleanupUploadedFile(uploadedFile);
            return res.status(domainCheck.error.status).json({
                success: false,
                message: domainCheck.error.message,
            });
        }

        const type = String(req.body?.type || req.query?.type || "category")
            .trim()
            .toLowerCase();
        const section =
            type === "product" || type === "products"
                ? "products"
                : "categories";

        const permissionCheck = assertCatalogPermission(
            account,
            "catalog",
            section
        );

        if (permissionCheck.error) {
            cleanupUploadedFile(uploadedFile);
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        if (!uploadedFile) {
            return res.status(400).json({
                success: false,
                message:
                    "Image file is required. Use form-data with key: image (type: File)",
            });
        }

        const folder =
            section === "products"
                ? "restaurant/catalog/products"
                : "restaurant/catalog/categories";

        const imageUrl = await uploadImageToCloudinary(uploadedFile, folder);

        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            type: section === "products" ? "product" : "category",
            image: imageUrl,
            frontendDomainUrl: owner.frontendDomainUrl,
        });
    } catch (error) {
        cleanupUploadedFile(uploadedFile);
        console.error("Upload catalog image error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload image",
        });
    }
};

export default uploadCatalogImage;
