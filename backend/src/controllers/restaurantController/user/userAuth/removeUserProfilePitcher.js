import deleteCloudinaryImage from "../../../../utils/superadminUtils/deleteCloudinaryImage.js";
import Customer from "../../../../models/restaurantModels/customer.js";
import Branch from "../../../../models/superadminModels/bussiness/branch.js";
import getPublicCustomer from "../../../../utils/restaurantUtils/getPublicCustomer.js";

const removeUserProfilePitcher = async (req, res) => {
    try {
        const customer = await Customer.findById(req.customer._id);
        const merchant = req.merchant;

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!customer.profilePitcher) {
            return res.status(400).json({
                success: false,
                message: "No profile pitcher found to remove",
            });
        }

        await deleteCloudinaryImage(customer.profilePitcher);

        customer.profilePitcher = "";
        await customer.save();

        const branch = await Branch.findById(customer.branchId).select(
            "name branchCode"
        );

        return res.status(200).json({
            success: true,
            message:
                "Profile pitcher removed from database and Cloudinary",
            accountType: "customer",
            user: getPublicCustomer(customer, { branch, merchant }),
        });
    } catch (error) {
        console.error("Remove user profile pitcher error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to remove profile pitcher",
        });
    }
};

export default removeUserProfilePitcher;
