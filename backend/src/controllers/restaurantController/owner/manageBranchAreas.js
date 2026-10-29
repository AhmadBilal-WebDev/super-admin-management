import mongoose from "mongoose";
import Branch from "../../../models/superadminModels/bussiness/branch.js";
import formatBranch from "../../../utils/superadminUtils/formatBranch.js";
import {
    formatServicePolygon,
    normalizeServicePolygon,
    parseRadiusKm,
} from "../../../utils/restaurantUtils/serviceAreaGeo.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
    getRestaurantActor,
} from "../../../utils/restaurantUtils/findManageableStaff.js";

const loadOwnerBranch = async (req) => {
    const { actor, owner, accountType } = getRestaurantActor(req);

    const domainCheck = assertOwnerDomain(
        owner,
        getFrontendDomainFromRequest(req)
    );

    if (domainCheck.error) {
        return {
            error: {
                status: domainCheck.error.status,
                message: domainCheck.error.message,
            },
        };
    }

    const branchId = req.params.branchId || req.params.id;

    if (!branchId || !mongoose.Types.ObjectId.isValid(branchId)) {
        return {
            error: {
                status: 400,
                message: "Valid branch id is required",
            },
        };
    }

    if (accountType !== "owner" && actor.accessAllBranches !== true) {
        const allowed = Array.isArray(actor.branchIds) ? actor.branchIds : [];
        const ok = allowed.some((id) => String(id) === String(branchId));
        if (!ok) {
            return {
                error: {
                    status: 403,
                    message: "You do not have access to this branch",
                },
            };
        }
    }

    const branch = await Branch.findOne({
        _id: branchId,
        merchantId: owner._id,
    });

    if (!branch) {
        return {
            error: {
                status: 404,
                message: "Branch not found",
            },
        };
    }

    return { branch };
};

const assertBranchHasLocation = (branch) => {
    if (!branch.latitude || !branch.longitude) {
        return {
            status: 400,
            message:
                "This branch has no restaurant location yet. Ask superadmin to set latitude and longitude first",
        };
    }
    return null;
};

const serviceAreaPayload = (branch) => ({
    latitude: branch.latitude || "",
    longitude: branch.longitude || "",
    radiusKm:
        branch.serviceRadiusKm === undefined || branch.serviceRadiusKm === null
            ? null
            : Number(branch.serviceRadiusKm),
    polygon: formatServicePolygon(branch.servicePolygon),
    pointCount: Array.isArray(branch.servicePolygon)
        ? branch.servicePolygon.length
        : 0,
});

/**
 * PUT — save map polygon (min 4 points) around restaurant.
 * Optional radiusKm is only a map helper; delivery boundary = polygon.
 */
const setBranchServiceArea = async (req, res) => {
    try {
        const loaded = await loadOwnerBranch(req);
        if (loaded.error) {
            return res.status(loaded.error.status).json({
                success: false,
                message: loaded.error.message,
            });
        }

        const { branch } = loaded;
        const locationError = assertBranchHasLocation(branch);
        if (locationError) {
            return res.status(locationError.status).json({
                success: false,
                message: locationError.message,
            });
        }

        const poly = normalizeServicePolygon(
            req.body?.polygon ?? req.body?.points ?? req.body?.coordinates
        );

        if (poly.error) {
            return res.status(400).json({
                success: false,
                message: poly.error,
            });
        }

        const radiusRaw =
            req.body?.radiusKm ??
            req.body?.serviceRadiusKm ??
            req.body?.radius ??
            req.body?.km;

        const radius = parseRadiusKm(radiusRaw, { required: false });
        if (radius.error) {
            return res.status(400).json({
                success: false,
                message: radius.error,
            });
        }

        branch.servicePolygon = poly.polygon;
        if (radius.provided) {
            branch.serviceRadiusKm = radius.radiusKm;
        }

        await branch.save();

        return res.status(200).json({
            success: true,
            message: "Service area updated successfully",
            branch: formatBranch(branch),
            serviceArea: serviceAreaPayload(branch),
        });
    } catch (error) {
        console.error("Set branch service area error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to set service area",
        });
    }
};

/** DELETE — clear polygon + radius */
const clearBranchServiceArea = async (req, res) => {
    try {
        const loaded = await loadOwnerBranch(req);
        if (loaded.error) {
            return res.status(loaded.error.status).json({
                success: false,
                message: loaded.error.message,
            });
        }

        const { branch } = loaded;
        branch.servicePolygon = [];
        branch.serviceRadiusKm = null;
        await branch.save();

        return res.status(200).json({
            success: true,
            message: "Service area cleared successfully",
            branch: formatBranch(branch),
            serviceArea: serviceAreaPayload(branch),
        });
    } catch (error) {
        console.error("Clear branch service area error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to clear service area",
        });
    }
};

export { setBranchServiceArea, clearBranchServiceArea };
export default setBranchServiceArea;
