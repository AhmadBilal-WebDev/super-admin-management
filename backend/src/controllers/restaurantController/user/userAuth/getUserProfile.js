import Branch from "../../../../models/superadminModels/bussiness/branch.js";
import getPublicCustomer from "../../../../utils/restaurantUtils/getPublicCustomer.js";

const getUserProfile = async (req, res) => {
    try {
        const customer = req.customer;
        const merchant = req.merchant;

        const branch = await Branch.findById(customer.branchId).select(
            "name branchCode city latitude longitude isActive"
        );

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            accountType: "customer",
            user: getPublicCustomer(customer, { branch, merchant }),
            branch: branch
                ? {
                      id: branch._id,
                      name: branch.name,
                      branchCode: branch.branchCode || "",
                      city: branch.city || "",
                      latitude: branch.latitude || "",
                      longitude: branch.longitude || "",
                  }
                : null,
        });
    } catch (error) {
        console.error("Get user profile error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch profile",
        });
    }
};

export default getUserProfile;
