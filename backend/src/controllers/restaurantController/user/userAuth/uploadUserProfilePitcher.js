import fs from "fs";
import cloudinary from "../../../../utils/superadminUtils/cloudinary.js";
import deleteCloudinaryImage from "../../../../utils/superadminUtils/deleteCloudinaryImage.js";
import Customer from "../../../../models/restaurantModels/customer.js";
import Branch from "../../../../models/superadminModels/bussiness/branch.js";
import getPublicCustomer from "../../../../utils/restaurantUtils/getPublicCustomer.js";

const uploadUserProfilePitcher = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Profile pitcher image is required",
            });
        }

        const customer = await Customer.findById(req.customer._id);
        const merchant = req.merchant;

        if (!customer) {
            if (req.file?.path) fs.unlink(req.file.path, () => {});
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (customer.profilePitcher) {
            await deleteCloudinaryImage(customer.profilePitcher);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "restaurant/customer-profile-pitcher",
        });

        fs.unlink(req.file.path, () => {});

        customer.profilePitcher = result.secure_url;
        await customer.save();

        const branch = await Branch.findById(customer.branchId).select(
            "name branchCode"
        );

        return res.status(200).json({
            success: true,
            message: "Profile pitcher uploaded successfully",
            accountType: "customer",
            user: getPublicCustomer(customer, { branch, merchant }),
        });
    } catch (error) {
        if (req.file?.path) {
            fs.unlink(req.file.path, () => {});
        }

        console.error("Upload user profile pitcher error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload profile pitcher",
        });
    }
};

export default uploadUserProfilePitcher;
