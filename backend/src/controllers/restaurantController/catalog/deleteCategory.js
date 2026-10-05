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

        const productsCount = await Product.countDocuments({
            merchantId: owner._id,
            categoryId: category._id,
        });

        if (productsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. ${productsCount} product(s) are linked to it`,
            });
        }

        const image = category.image || "";
        const deleted = formatCategory(category);

        await category.deleteOne();

        if (image) {
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
            message: "Category deleted successfully",
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
