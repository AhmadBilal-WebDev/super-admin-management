import Category from "../../../models/restaurantModels/category.js";
import Product from "../../../models/restaurantModels/product.js";
import deleteCloudinaryImage from "../../../utils/superadminUtils/deleteCloudinaryImage.js";
import formatProduct from "../../../utils/restaurantUtils/formatProduct.js";
import { removeProductFromCategory } from "../../../utils/restaurantUtils/syncCategoryProducts.js";
import {
    assertCatalogPermission,
    getCatalogActor,
} from "../../../utils/restaurantUtils/catalogScope.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../utils/restaurantUtils/findManageableStaff.js";

const deleteProduct = async (req, res) => {
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
            "products"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const product = await Product.findOne({
            _id: req.params.id,
            merchantId: owner._id,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const image = product.image || "";
        const categoryId = product.categoryId;
        const productId = product._id;
        const category = await Category.findById(categoryId);
        const deleted = formatProduct(product, category);

        await product.deleteOne();
        await removeProductFromCategory(categoryId, productId);

        if (image) {
            try {
                await deleteCloudinaryImage(image);
            } catch (cloudinaryError) {
                console.error(
                    "Cloudinary cleanup failed after product delete:",
                    cloudinaryError
                );
            }
        }

        const updatedCategory = categoryId
            ? await Category.findById(categoryId)
            : null;

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            categoryProducts: (updatedCategory?.products || []).map((item) => ({
                productId: item.productId,
                name: item.name,
                sku: item.sku || "",
            })),
            product: deleted,
        });
    } catch (error) {
        console.error("Delete product error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete product",
        });
    }
};

export default deleteProduct;
