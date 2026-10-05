import Category from "../../models/restaurantModels/category.js";

const buildCategoryProductEntry = (product) => ({
    productId: product._id,
    name: product.name,
    sku: product.sku || "",
});

const pushProductToCategory = async (categoryId, product) => {
    if (!categoryId || !product?._id) return;

    await Category.updateOne(
        { _id: categoryId },
        {
            $pull: { products: { productId: product._id } },
        }
    );

    await Category.updateOne(
        { _id: categoryId },
        {
            $push: {
                products: buildCategoryProductEntry(product),
            },
        }
    );
};

const updateProductInCategory = async (categoryId, product) => {
    if (!categoryId || !product?._id) return;

    const result = await Category.updateOne(
        { _id: categoryId, "products.productId": product._id },
        {
            $set: {
                "products.$.name": product.name,
                "products.$.sku": product.sku || "",
            },
        }
    );

    if (result.matchedCount === 0) {
        await pushProductToCategory(categoryId, product);
    }
};

const removeProductFromCategory = async (categoryId, productId) => {
    if (!categoryId || !productId) return;

    await Category.updateOne(
        { _id: categoryId },
        {
            $pull: { products: { productId } },
        }
    );
};

const moveProductBetweenCategories = async ({
    fromCategoryId,
    toCategoryId,
    product,
}) => {
    if (
        fromCategoryId &&
        toCategoryId &&
        String(fromCategoryId) === String(toCategoryId)
    ) {
        await updateProductInCategory(toCategoryId, product);
        return;
    }

    if (fromCategoryId) {
        await removeProductFromCategory(fromCategoryId, product._id);
    }

    if (toCategoryId) {
        await pushProductToCategory(toCategoryId, product);
    }
};

export {
    buildCategoryProductEntry,
    pushProductToCategory,
    updateProductInCategory,
    removeProductFromCategory,
    moveProductBetweenCategories,
};
