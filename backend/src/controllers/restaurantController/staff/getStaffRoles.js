import Staff from "../../../models/restaurantModels/staff.js";
import {
    canViewAllStaff,
    canManageCreatedStaffRole,
    assertOwnerDomain,
    getFrontendDomainFromRequest,
    getRestaurantActor,
} from "../../../utils/restaurantUtils/findManageableStaff.js";
import getPublicStaff from "../../../utils/restaurantUtils/getPublicStaff.js";

const getStaffRoles = async (req, res) => {
    try {
        const { actor, owner, accountType, actorId } = getRestaurantActor(req);

        if (!canViewAllStaff(actor)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view staff roles",
            });
        }

        const domainCheck = assertOwnerDomain(
            owner,
            getFrontendDomainFromRequest(req)
        );

        if (domainCheck.error) {
            return res.status(domainCheck.error.status).json({
                success: false,
                message: domainCheck.error.message,
            });
        }

        // Owner → all roles. Staff → only roles they created.
        const filter = { merchantId: owner._id };

        if (accountType === "staff") {
            filter.createdBy = actorId;
            filter.createdByType = "staff";
        }

        const staffList = await Staff.find(filter)
            .select("-password -otp")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Staff roles fetched successfully",
            count: staffList.length,
            accountType,
            staff: staffList.map((item) => ({
                ...getPublicStaff(item),
                canManage: canManageCreatedStaffRole(
                    accountType,
                    actorId,
                    item
                ),
            })),
        });
    } catch (error) {
        console.error("Get staff roles error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch staff roles",
        });
    }
};

export default getStaffRoles;
