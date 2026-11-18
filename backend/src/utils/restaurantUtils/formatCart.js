const formatCartItem = (item) => ({
    id: item._id,
    productId: item.productId,
    categoryId: item.categoryId || null,
    name: item.name || "",
    sku: item.sku || "",
    image: item.image || "",
    quantity: item.quantity,
    unitPrice: item.unitPrice ?? 0,
    basePrice: item.basePrice ?? 0,
    discountPrice: item.discountPrice ?? null,
    tax: item.tax ?? 0,
    variantId: item.variantId || item.variant?.variantId || null,
    variant: item.variant || null,
    addons: item.addons || [],
    notes: item.notes || "",
    lineSubtotal: item.lineSubtotal ?? 0,
    lineTax: item.lineTax ?? 0,
    lineTotal: item.lineTotal ?? 0,
});

const formatCart = (cart) => ({
    id: cart._id,
    merchantId: cart.merchantId,
    customerId: cart.customerId,
    branchId: cart.branchId || null,
    branchName: cart.branchName || "",
    items: (cart.items || []).map(formatCartItem),
    itemsCount: cart.itemsCount ?? 0,
    subtotal: cart.subtotal ?? 0,
    taxTotal: cart.taxTotal ?? 0,
    grandTotal: cart.grandTotal ?? 0,
    currency: cart.currency || "PKR",
    updatedAt: cart.updatedAt,
    createdAt: cart.createdAt,
});

export { formatCartItem, formatCart };
export default formatCart;
