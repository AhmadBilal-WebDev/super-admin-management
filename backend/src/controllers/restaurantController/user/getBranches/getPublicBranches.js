import Branch from "../../../../models/superadminModels/bussiness/branch.js";
import findMerchantByDomain from "../../../../utils/restaurantUtils/findMerchantByDomain.js";
import formatBranch from "../../../../utils/superadminUtils/formatBranch.js";

const formatPublicBranch = (branch) => ({
    // ...formatBranch(branch),
    address: branch.address || "",
    city: branch.city || "",
    province: branch.province || "",
    country: branch.country || "",
    district: branch.district || "",
    contactNumber: branch.contactNumber || "",
    countryCode: branch.countryCode || "",
    openingTime: branch.openingTime || "",
    closingTime: branch.closingTime || "",
    latitude: branch.latitude || "",
    longitude: branch.longitude || "",
    isActive: branch.isActive !== false,
});

const getPublicBranches = async (req, res) => {
    try {
        const merchantResult = await findMerchantByDomain(req);

        if (merchantResult.error) {
            return res.status(merchantResult.error.status).json({
                success: false,
                message: merchantResult.error.message,
            });
        }

        const { merchant } = merchantResult;

        const { city, province, country, district, branchCode, search } =
            req.query;

        const filter = {
            merchantId: merchant._id,
            isActive: true,
        };

        if (city && String(city).trim()) {
            filter.city = new RegExp(`^${String(city).trim()}$`, "i");
        }

        if (province && String(province).trim()) {
            filter.province = new RegExp(`^${String(province).trim()}$`, "i");
        }

        if (country && String(country).trim()) {
            filter.country = new RegExp(`^${String(country).trim()}$`, "i");
        }

        if (district && String(district).trim()) {
            filter.district = new RegExp(`^${String(district).trim()}$`, "i");
        }

        if (branchCode && String(branchCode).trim()) {
            filter.branchCode = String(branchCode).trim().toUpperCase();
        }

        if (search && String(search).trim()) {
            const term = String(search).trim();
            filter.$or = [
                { name: { $regex: term, $options: "i" } },
                { branchCode: { $regex: term, $options: "i" } },
                { city: { $regex: term, $options: "i" } },
                { address: { $regex: term, $options: "i" } },
            ];
        }

        const branches = await Branch.find(filter).sort({ name: 1 });

        return res.status(200).json({
            success: true,
            message: "Branches fetched successfully",
            count: branches.length,
            frontendDomainUrl: merchant.frontendDomainUrl,
            // merchant: {
            //     id: merchant._id,
            //     name: merchant.name,
            //     slug: merchant.slug || "",
            // },
            branches: branches.map(formatPublicBranch),
        });
    } catch (error) {
        console.error("Get public branches error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch branches",
        });
    }
};

export default getPublicBranches;
