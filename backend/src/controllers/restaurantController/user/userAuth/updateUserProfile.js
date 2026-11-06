import mongoose from "mongoose";
import Customer from "../../../../models/restaurantModels/customer.js";
import Branch from "../../../../models/superadminModels/bussiness/branch.js";
import getPublicCustomer from "../../../../utils/restaurantUtils/getPublicCustomer.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";

/**
 * Update customer profile fields (not profile image, not email).
 * Image → upload / remove profile pitcher APIs.
 * Email is identity — cannot be changed here.
 */
const updateUserProfile = async (req, res) => {
    try {
        if (req.body?.profilePitcher !== undefined) {
            return res.status(400).json({
                success: false,
                message:
                    "Profile pitcher cannot be updated here. Use upload/remove profile pitcher APIs",
            });
        }

        if (req.body?.email !== undefined) {
            return res.status(400).json({
                success: false,
                message: "Email cannot be updated",
            });
        }

        const domainCheck = assertOwnerDomain(
            req.merchant,
            getFrontendDomainFromRequest(req)
        );

        if (domainCheck.error) {
            return res.status(domainCheck.error.status).json({
                success: false,
                message: domainCheck.error.message,
            });
        }

        const customer = await Customer.findById(req.customer._id);
        const merchant = req.merchant;

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const {
            name,
            gender,
            countryCode,
            contactNumber,
            phone,
            branchId,
            branch_id,
        } = req.body;

        const update = {};

        if (name !== undefined) {
            const trimmed = String(name).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Name is required",
                });
            }
            if (trimmed.length > 120) {
                return res.status(400).json({
                    success: false,
                    message: "Name too long (max 120)",
                });
            }
            update.name = trimmed;
        }

        if (gender !== undefined) {
            const normalizedGender = String(gender).toLowerCase().trim();
            if (!["male", "female"].includes(normalizedGender)) {
                return res.status(400).json({
                    success: false,
                    message: "Gender must be male or female",
                });
            }
            update.gender = normalizedGender;
        }

        if (countryCode !== undefined) {
            update.countryCode = String(countryCode || "").trim();
        }

        if (contactNumber !== undefined || phone !== undefined) {
            const trimmed = String(
                contactNumber !== undefined ? contactNumber : phone
            ).trim();

            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Contact number is required",
                });
            }

            update.contactNumber = trimmed;
        }

        const nextBranchId = branchId ?? branch_id;
        if (nextBranchId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(nextBranchId)) {
                return res.status(400).json({
                    success: false,
                    message: "Valid branch id is required",
                });
            }

            const branch = await Branch.findOne({
                _id: nextBranchId,
                merchantId: customer.merchantId,
                isActive: true,
            }).select("_id");

            if (!branch) {
                return res.status(404).json({
                    success: false,
                    message: "Selected branch not found for this restaurant",
                });
            }

            update.branchId = branch._id;
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No profile fields provided to update",
            });
        }

        const updated = await Customer.findByIdAndUpdate(
            customer._id,
            update,
            { new: true, runValidators: true }
        );

        const branch = await Branch.findById(updated.branchId).select(
            "name branchCode city latitude longitude isActive"
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            accountType: "customer",
            user: getPublicCustomer(updated, { branch, merchant }),
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
        console.error("Update user profile error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update profile",
        });
    }
};

export default updateUserProfile;
