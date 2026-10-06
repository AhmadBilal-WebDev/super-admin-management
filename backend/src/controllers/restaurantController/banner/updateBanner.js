import Banner from "../../../models/restaurantModels/banner.js";
import formatBanner from "../../../utils/restaurantUtils/formatBanner.js";
import { parseOptionalDate } from "./createBanner.js";
import {
    assertCatalogPermission,
    parseBoolean,
    getCatalogActor,
    resolveCatalogWriteScope,
} from "../../../utils/restaurantUtils/catalogScope.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../utils/restaurantUtils/findManageableStaff.js";

const updateBanner = async (req, res) => {
    try {
        const { account, owner } = getCatalogActor(req);

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

        const permissionCheck = assertCatalogPermission(
            account,
            "marketing",
            "banners"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const banner = await Banner.findOne({
            _id: req.params.id,
            merchantId: owner._id,
        });

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }

        const update = {};

        if (req.body.title !== undefined) {
            const trimmed = String(req.body.title).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Banner title is required",
                });
            }
            update.title = trimmed;
        }

        if (req.body.shortText !== undefined) {
            update.shortText = String(req.body.shortText || "").trim();
        }

        if (req.body.description !== undefined) {
            update.description = String(req.body.description || "").trim();
        }

        if (req.body.image !== undefined) {
            update.image = String(req.body.image || "").trim();
        }

        if (req.body.tag !== undefined || req.body.badge !== undefined) {
            update.tag = String(
                req.body.tag !== undefined ? req.body.tag : req.body.badge || ""
            ).trim();
        }

        if (req.body.buttonText !== undefined) {
            update.buttonText = String(req.body.buttonText || "").trim();
        }

        if (req.body.buttonLink !== undefined) {
            update.buttonLink = String(req.body.buttonLink || "").trim();
        }

        if (req.body.secondaryButtonText !== undefined) {
            update.secondaryButtonText = String(
                req.body.secondaryButtonText || ""
            ).trim();
        }

        if (req.body.secondaryButtonLink !== undefined) {
            update.secondaryButtonLink = String(
                req.body.secondaryButtonLink || ""
            ).trim();
        }

        if (
            req.body.sort !== undefined ||
            req.body.displayOrder !== undefined
        ) {
            const sortValue = Number(
                req.body.sort !== undefined
                    ? req.body.sort
                    : req.body.displayOrder
            );
            update.displayOrder = Number.isNaN(sortValue) ? 0 : sortValue;
        }

        if (req.body.isActive !== undefined) {
            update.isActive = parseBoolean(req.body.isActive, banner.isActive);
        }

        try {
            if (req.body.startDate !== undefined) {
                update.startDate = parseOptionalDate(
                    req.body.startDate,
                    "start date"
                );
            }
            if (req.body.endDate !== undefined) {
                update.endDate = parseOptionalDate(
                    req.body.endDate,
                    "end date"
                );
            }
        } catch (dateError) {
            return res.status(400).json({
                success: false,
                message: dateError.message,
            });
        }

        const nextStart =
            update.startDate !== undefined ? update.startDate : banner.startDate;
        const nextEnd =
            update.endDate !== undefined ? update.endDate : banner.endDate;

        if (nextStart && nextEnd && nextEnd < nextStart) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date",
            });
        }

        if (
            req.body.showAllBranches !== undefined ||
            req.body.branchId ||
            req.body.branchName
        ) {
            const scope = await resolveCatalogWriteScope(req);

            if (scope.error) {
                return res.status(scope.error.status).json({
                    success: false,
                    message: scope.error.message,
                });
            }

            update.showAllBranches = scope.showAllBranches;
            update.branchId = scope.branchId;
            update.branchName = scope.branchName;
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No banner fields provided to update",
            });
        }

        Object.assign(banner, update);
        await banner.save();

        return res.status(200).json({
            success: true,
            message: "Banner updated successfully",
            frontendDomainUrl: owner.frontendDomainUrl,
            banner: formatBanner(banner),
        });
    } catch (error) {
        console.error("Update banner error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update banner",
        });
    }
};

export default updateBanner;
