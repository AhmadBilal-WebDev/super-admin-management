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

const resolveUploadSection = (rawType) => {
    const type = String(rawType || "category").trim().toLowerCase();

    if (type === "product" || type === "products") {
        return {
            section: "products",
            permission: ["catalog", "products"],
            folder: "restaurant/catalog/products",
            responseType: "product",
        };
    }

    if (type === "banner" || type === "banners") {
        return {
            section: "banners",
            permission: ["marketing", "banners"],
            folder: "restaurant/banners",
            responseType: "banner",
        };
    }

    if (
        type === "deal" ||
        type === "deals" ||
        type === "dealscombos" ||
        type === "combo"
    ) {
        return {
            section: "deals",
            permission: ["catalog", "dealscombos"],
            folder: "restaurant/catalog/deals",
            responseType: "deal",
        };
    }

    return {
        section: "categories",
        permission: ["catalog", "categories"],
        folder: "restaurant/catalog/categories",
        responseType: "category",
    };
};

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

        const uploadMeta = resolveUploadSection(
            req.body?.type || req.query?.type
        );

        const permissionCheck = assertCatalogPermission(
            account,
            ...uploadMeta.permission
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

        const imageUrl = await uploadImageToCloudinary(
            uploadedFile,
            uploadMeta.folder
        );

        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            type: uploadMeta.responseType,
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
