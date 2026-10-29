import mongoose from "mongoose";
import Branch from "../../../../models/superadminModels/bussiness/branch.js";
import findMerchantByDomain from "../../../../utils/restaurantUtils/findMerchantByDomain.js";
import { isDeliveryInsideBranchServiceArea } from "../../../../utils/restaurantUtils/serviceAreaGeo.js";

/**
 * Public check: can this lat/lng place an order for this branch?
 * Outside polygon → notAllowed (frontend / future order API both use this).
 */
const checkBranchServiceArea = async (req, res) => {
    try {
        const merchantResult = await findMerchantByDomain(req);

        if (merchantResult.error) {
            return res.status(merchantResult.error.status).json({
                success: false,
                message: merchantResult.error.message,
            });
        }

        const { merchant } = merchantResult;
        const branchId = req.params.branchId || req.params.id;

        if (!branchId || !mongoose.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({
                success: false,
                message: "Valid branch id is required",
            });
        }

        const latitude =
            req.body?.latitude ??
            req.body?.lat ??
            req.query?.latitude ??
            req.query?.lat;
        const longitude =
            req.body?.longitude ??
            req.body?.lng ??
            req.body?.lon ??
            req.query?.longitude ??
            req.query?.lng ??
            req.query?.lon;

        const branch = await Branch.findOne({
            _id: branchId,
            merchantId: merchant._id,
            isActive: true,
        }).select("name latitude longitude serviceRadiusKm servicePolygon");

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: "Branch not found",
            });
        }

        const check = isDeliveryInsideBranchServiceArea(
            branch,
            latitude,
            longitude
        );

        if (!check.ok) {
            return res.status(200).json({
                success: true,
                allowed: false,
                message: check.reason,
                branchId: branch._id,
                branchName: branch.name,
            });
        }

        return res.status(200).json({
            success: true,
            allowed: true,
            message: "Location is inside the restaurant service area",
            branchId: branch._id,
            branchName: branch.name,
        });
    } catch (error) {
        console.error("Check branch service area error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to check service area",
        });
    }
};

export default checkBranchServiceArea;
