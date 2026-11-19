const formatOrderCustomer = (order, liveCustomer = null) => {
    const snap = order.customerSnapshot || {};

    return {
        id: order.customerId || liveCustomer?._id || null,
        name: liveCustomer?.name || snap.name || "",
        email: liveCustomer?.email || snap.email || "",
        gender: liveCustomer?.gender || snap.gender || "",
        countryCode: liveCustomer?.countryCode || snap.countryCode || "",
        contactNumber:
            liveCustomer?.contactNumber || snap.contactNumber || "",
        profilePitcher:
            liveCustomer?.profilePitcher || snap.profilePitcher || "",
        branchId:
            liveCustomer?.branchId || snap.branchId || order.branchId || null,
        isActive: liveCustomer ? liveCustomer.isActive !== false : true,
        isVerified: liveCustomer ? liveCustomer.isVerified === true : undefined,
    };
};

const formatOrderItem = (item) => ({
    id: item._id,
    productId: item.productId,
    categoryId: item.categoryId || null,
    name: item.name,
    sku: item.sku || "",
    image: item.image || "",
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    basePrice: item.basePrice,
    discountPrice: item.discountPrice,
    tax: item.tax ?? 0,
    variant: item.variant || null,
    addons: item.addons || [],
    notes: item.notes || "",
    lineSubtotal: item.lineSubtotal,
    lineTax: item.lineTax ?? 0,
    lineTotal: item.lineTotal,
});

const formatOrder = (order, liveCustomer = null) => ({
    id: order._id,
    orderNumber: order.orderNumber,
    merchantId: order.merchantId,
    bussinessId: order.bussinessId,
    customerId: order.customerId,
    branchId: order.branchId,
    branchName: order.branchName || "",
    orderMode: order.orderMode,
    selectedArea: order.selectedArea || "",
    latitude: order.latitude || "",
    longitude: order.longitude || "",
    deliveryAddress: order.deliveryAddress || "",
    customer: formatOrderCustomer(order, liveCustomer),
    items: (order.items || []).map(formatOrderItem),
    itemsCount: order.itemsCount ?? 0,
    uniqueItemsCount: Array.isArray(order.items) ? order.items.length : 0,
    priceSummary: {
        currency: order.currency || "PKR",
        subtotal: order.subtotal ?? 0,
        taxTotal: order.taxTotal ?? 0,
        deliveryFee: order.deliveryFee ?? 0,
        discountTotal: order.discountTotal ?? 0,
        grandTotal: order.grandTotal ?? 0,
    },
    subtotal: order.subtotal,
    taxTotal: order.taxTotal ?? 0,
    deliveryFee: order.deliveryFee ?? 0,
    discountTotal: order.discountTotal ?? 0,
    grandTotal: order.grandTotal,
    currency: order.currency || "PKR",
    notes: order.notes || "",
    paymentMethod: order.paymentMethod || "cod",
    paymentStatus: order.paymentStatus || "pending",
    status: order.status || "pending",
    statusHistory: order.statusHistory || [],
    cancelledAt: order.cancelledAt || null,
    cancelReason: order.cancelReason || "",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
});

export { formatOrderCustomer, formatOrderItem, formatOrder };
export default formatOrder;
