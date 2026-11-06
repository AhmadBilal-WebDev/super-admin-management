import { formatServicePolygon } from "../restaurantUtils/serviceAreaGeo.js";

const formatBranch = (branch) => ({
    id: branch._id,
    bussinessId: branch.bussinessId,
    merchantId: branch.merchantId,
    name: branch.name,
    slug: branch.slug || "",
    branchCode: branch.branchCode,
    address: branch.address || "",
    city: branch.city || "",
    province: branch.province || "",
    country: branch.country || "",
    district: branch.district || "",
    email: branch.email || "",
    // Noreply email used to send customer OTPs (sharable across branches)
    otpEmail: branch.otpEmail || "",
    // Restaurant pin (superadmin) — map center
    latitude: branch.latitude || "",
    longitude: branch.longitude || "",
    // Optional map helper radius
    serviceRadiusKm:
        branch.serviceRadiusKm === undefined || branch.serviceRadiusKm === null
            ? null
            : Number(branch.serviceRadiusKm),
    // Delivery boundary — orders only inside these points
    servicePolygon: formatServicePolygon(branch.servicePolygon),
    isActive: branch.isActive !== false,
});

export default formatBranch;
