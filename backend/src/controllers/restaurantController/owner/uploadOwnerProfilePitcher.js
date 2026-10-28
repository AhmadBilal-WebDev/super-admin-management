import fs from "fs";
import cloudinary from "../../../utils/superadminUtils/cloudinary.js";
import deleteCloudinaryImage from "../../../utils/superadminUtils/deleteCloudinaryImage.js";
import Merchant from "../../../models/superadminModels/bussiness/merchant.js";
import Staff from "../../../models/restaurantModels/staff.js";
import getPublicOwner from "../../../utils/tenantUtils/getPublicOwner.js";
import getPublicStaff from "../../../utils/restaurantUtils/getPublicStaff.js";
import { getRestaurantActor } from "../../../utils/restaurantUtils/findManageableStaff.js";

const uploadOwnerProfilePitcher = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Profile pitcher image is required",
            });
        }

        const { accountType, actorId } = getRestaurantActor(req);

        if (accountType === "staff") {
            const staff = await Staff.findById(actorId);

            if (!staff) {
                if (req.file?.path) fs.unlink(req.file.path, () => {});
                return res.status(404).json({
                    success: false,
                    message: "Staff not found",
                });
            }

            if (staff.profilePitcher) {
                await deleteCloudinaryImage(staff.profilePitcher);
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "restaurant/staff-profile-pitcher",
            });

            fs.unlink(req.file.path, () => {});

            staff.profilePitcher = result.secure_url;
            await staff.save();

            return res.status(200).json({
                success: true,
                message: "Staff profile pitcher uploaded successfully",
                accountType: "staff",
                staff: getPublicStaff(staff),
            });
        }

        const merchant = await Merchant.findById(req.owner._id);

        if (!merchant) {
            if (req.file?.path) fs.unlink(req.file.path, () => {});
            return res.status(404).json({
                success: false,
                message: "Owner not found",
            });
        }

        if (merchant.profilePitcher) {
            await deleteCloudinaryImage(merchant.profilePitcher);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "restaurant/owner-profile-pitcher",
        });

        fs.unlink(req.file.path, () => {});

        merchant.profilePitcher = result.secure_url;
        await merchant.save();

        return res.status(200).json({
            success: true,
            message: "Owner profile pitcher uploaded successfully",
            accountType: "owner",
            owner: getPublicOwner(merchant),
        });
    } catch (error) {
        if (req.file?.path) {
            fs.unlink(req.file.path, () => {});
        }

        console.error("Upload profile pitcher error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default uploadOwnerProfilePitcher;
