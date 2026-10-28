import Merchant from "../../../models/superadminModels/bussiness/merchant.js";
import Staff from "../../../models/restaurantModels/staff.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
    getRestaurantActor,
} from "../../../utils/restaurantUtils/findManageableStaff.js";

const normalizeTheme = (value) => {
    const theme = String(value || "")
        .trim()
        .toLowerCase();

    if (theme === "dark") return "dark";
    if (theme === "light") return "light";
    return null;
};

const getTheme = async (req, res) => {
    try {
        const { accountType, actorId, owner } = getRestaurantActor(req);

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

        let theme = "light";

        if (accountType === "staff") {
            const staff = await Staff.findById(actorId).select("theme");
            theme = staff?.theme === "dark" ? "dark" : "light";
        } else {
            const merchant = await Merchant.findById(owner._id).select("theme");
            theme = merchant?.theme === "dark" ? "dark" : "light";
        }

        return res.status(200).json({
            success: true,
            message: "Theme fetched successfully",
            accountType,
            theme,
            availableThemes: ["light", "dark"],
        });
    } catch (error) {
        console.error("Get theme error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch theme",
        });
    }
};

const updateTheme = async (req, res) => {
    try {
        const { accountType, actorId, owner } = getRestaurantActor(req);

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

        const theme = normalizeTheme(
            req.body?.theme ?? req.query?.theme
        );

        if (!theme) {
            return res.status(400).json({
                success: false,
                message: "Theme must be light or dark",
            });
        }

        if (accountType === "staff") {
            const staff = await Staff.findByIdAndUpdate(
                actorId,
                { theme },
                { new: true }
            ).select("-password -otp");

            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: "Staff not found",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Theme updated successfully",
                accountType: "staff",
                theme: staff.theme === "dark" ? "dark" : "light",
            });
        }

        const merchant = await Merchant.findByIdAndUpdate(
            owner._id,
            { theme },
            { new: true }
        );

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: "Owner not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Theme updated successfully",
            accountType: "owner",
            theme: merchant.theme === "dark" ? "dark" : "light",
        });
    } catch (error) {
        console.error("Update theme error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update theme",
        });
    }
};

export { getTheme, updateTheme };
export default updateTheme;
