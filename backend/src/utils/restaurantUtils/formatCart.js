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

const formatCheckout = (checkout = {}) => ({
    isReady: checkout.isReady === true,
    orderMode: checkout.orderMode || "",
    paymentMethod: checkout.paymentMethod || "",
    selectedArea: checkout.selectedArea || "",
    latitude: checkout.latitude || "",
    longitude: checkout.longitude || "",
    deliveryAddress: checkout.deliveryAddress || "",
    deliveryFee: checkout.deliveryFee ?? 0,
    discountTotal: checkout.discountTotal ?? 0,
    checkoutGrandTotal: checkout.checkoutGrandTotal ?? 0,
    notes: checkout.notes || "",
    preparedAt: checkout.preparedAt || null,
});

const formatCart = (cart) => ({
    id: cart._id,
    merchantId: cart.merchantId,
    customerId: cart.customerId,
    branchId: cart.branchId || null,
    branchName: cart.branchName || "",
    items: (cart.items || []).map(formatCartItem),
    uniqueItemsCount: Array.isArray(cart.items) ? cart.items.length : 0,
    itemsCount: cart.itemsCount ?? 0,
    subtotal: cart.subtotal ?? 0,
    taxTotal: cart.taxTotal ?? 0,
    grandTotal: cart.grandTotal ?? 0,
    currency: cart.currency || "PKR",
    checkout: formatCheckout(cart.checkout || {}),
    updatedAt: cart.updatedAt,
    createdAt: cart.createdAt,
});

export { formatCartItem, formatCheckout, formatCart };
export default formatCart;
