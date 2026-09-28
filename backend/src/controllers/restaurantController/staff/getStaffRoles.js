import Staff from "../../../models/restaurantModels/staff.js";
import {
    canViewAllStaff,
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../utils/restaurantUtils/findManageableStaff.js";
import getPublicStaff from "../../../utils/restaurantUtils/getPublicStaff.js";

const getStaffRoles = async (req, res) => {
    try {
        const owner = req.owner;

        if (!canViewAllStaff(owner)) {
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

        const staffList = await Staff.find({ merchantId: owner._id })
            .select("-password -otp")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Staff roles fetched successfully",
            count: staffList.length,
            staff: staffList.map(getPublicStaff),
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
