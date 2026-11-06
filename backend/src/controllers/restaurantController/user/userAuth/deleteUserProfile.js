import Customer from "../../../../models/restaurantModels/customer.js";
import deleteCloudinaryImage from "../../../../utils/superadminUtils/deleteCloudinaryImage.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";

/**
 * Permanently delete customer account from DB.
 * Also removes profile pitcher from Cloudinary.
 * Same email can signup again afterwards.
 */
const deleteUserProfile = async (req, res) => {
    try {
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

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const deletedEmail = customer.email;
        const profilePitcher = customer.profilePitcher || "";

        if (profilePitcher) {
            try {
                await deleteCloudinaryImage(profilePitcher);
            } catch (cloudError) {
                console.error(
                    "Delete customer Cloudinary image error:",
                    cloudError
                );
                // Continue — account must still be removed from DB
            }
        }

        await Customer.deleteOne({ _id: customer._id });

        return res.status(200).json({
            success: true,
            message:
                "Profile deleted permanently. You can signup again with the same email",
            deletedEmail,
            profilePitcherRemoved: Boolean(profilePitcher),
            nextStep: "signup",
        });
    } catch (error) {
        console.error("Delete user profile error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete profile",
        });
    }
};

export default deleteUserProfile;
