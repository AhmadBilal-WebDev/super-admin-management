import Category from "../../../models/restaurantModels/category.js";
import Product from "../../../models/restaurantModels/product.js";
import deleteCloudinaryImage from "../../../utils/superadminUtils/deleteCloudinaryImage.js";
import formatCategory from "../../../utils/restaurantUtils/formatCategory.js";
import {
    assertCatalogPermission,
    getCatalogActor,
} from "../../../utils/restaurantUtils/catalogScope.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../utils/restaurantUtils/findManageableStaff.js";

const deleteCategory = async (req, res) => {
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
            "categories"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const category = await Category.findOne({
            _id: req.params.id,
            merchantId: owner._id,
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const products = await Product.find({
            merchantId: owner._id,
            categoryId: category._id,
        }).select("_id image");

        const productImages = products
            .map((item) => item.image)
            .filter(Boolean);
        const deletedProductsCount = products.length;
        const categoryImage = category.image || "";
        const deleted = formatCategory(category);

        if (deletedProductsCount > 0) {
            await Product.deleteMany({
                merchantId: owner._id,
                categoryId: category._id,
            });
        }

        await category.deleteOne();

        const imagesToCleanup = [...productImages];
        if (categoryImage) imagesToCleanup.push(categoryImage);

        for (const image of imagesToCleanup) {
            try {
                await deleteCloudinaryImage(image);
            } catch (cloudinaryError) {
                console.error(
                    "Cloudinary cleanup failed after category delete:",
                    cloudinaryError
                );
            }
        }

        return res.status(200).json({
            success: true,
            message:
                deletedProductsCount > 0
                    ? `Category and ${deletedProductsCount} product(s) deleted successfully`
                    : "Category deleted successfully",
            deletedProductsCount,
            category: deleted,
        });
    } catch (error) {
        console.error("Delete category error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete category",
        });
    }
};

export default deleteCategory;
