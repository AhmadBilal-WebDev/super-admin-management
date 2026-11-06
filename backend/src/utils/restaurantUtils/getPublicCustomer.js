const getPublicCustomer = (customer, { branch = null, merchant = null } = {}) => ({
    id: customer._id,
    accountType: "customer",
    name: customer.name || "",
    email: customer.email || "",
    gender: customer.gender || "",
    countryCode: customer.countryCode || "",
    contactNumber: customer.contactNumber || "",
    profilePitcher: customer.profilePitcher || "",
    branchId: customer.branchId,
    branchName: branch?.name || "",
    branchCode: branch?.branchCode || "",
    merchantId: customer.merchantId,
    merchantName: merchant?.name || "",
    frontendDomainUrl: merchant?.frontendDomainUrl || "",
    isVerified: customer.isVerified === true,
    lastLoginAt: customer.lastLoginAt || null,
    // lat/lng are NOT on user — send with each order
});

export default getPublicCustomer;
