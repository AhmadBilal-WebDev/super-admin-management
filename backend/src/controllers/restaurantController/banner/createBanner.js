import Banner from "../../../models/restaurantModels/banner.js";
import formatBanner from "../../../utils/restaurantUtils/formatBanner.js";
import {
    assertCatalogPermission,
    parseBoolean,
    resolveCatalogWriteScope,
} from "../../../utils/restaurantUtils/catalogScope.js";

const parseOptionalDate = (value, fieldName) => {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid ${fieldName}`);
    }

    return date;
};

const createBanner = async (req, res) => {
    try {
        const scope = await resolveCatalogWriteScope(req);

        if (scope.error) {
            return res.status(scope.error.status).json({
                success: false,
                message: scope.error.message,
            });
        }

        const permissionCheck = assertCatalogPermission(
            scope.account,
            "marketing",
            "banners"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const {
            title,
            shortText,
            description,
            image,
            tag,
            badge,
            buttonText,
            buttonLink,
            secondaryButtonText,
            secondaryButtonLink,
            displayOrder,
            sort,
            isActive,
            startDate,
            endDate,
        } = req.body;

        if (!title || !String(title).trim()) {
            return res.status(400).json({
                success: false,
                message: "Banner title is required",
            });
        }

        let parsedStart = null;
        let parsedEnd = null;

        try {
            parsedStart = parseOptionalDate(startDate, "start date");
            parsedEnd = parseOptionalDate(endDate, "end date");
        } catch (dateError) {
            return res.status(400).json({
                success: false,
                message: dateError.message,
            });
        }

        if (parsedStart && parsedEnd && parsedEnd < parsedStart) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date",
            });
        }

        const sortValue =
            sort !== undefined && sort !== ""
                ? Number(sort)
                : displayOrder !== undefined && displayOrder !== ""
                  ? Number(displayOrder)
                  : 0;

        const banner = await Banner.create({
            merchantId: scope.owner._id,
            bussinessId: scope.owner.bussinessId,
            branchId: scope.branchId,
            branchName: scope.branchName,
            showAllBranches: scope.showAllBranches,
            title: String(title).trim(),
            shortText: shortText ? String(shortText).trim() : "",
            description: description ? String(description).trim() : "",
            image: image ? String(image).trim() : "",
            tag: String(tag || badge || "").trim(),
            buttonText: buttonText ? String(buttonText).trim() : "",
            buttonLink: buttonLink ? String(buttonLink).trim() : "",
            secondaryButtonText: secondaryButtonText
                ? String(secondaryButtonText).trim()
                : "",
            secondaryButtonLink: secondaryButtonLink
                ? String(secondaryButtonLink).trim()
                : "",
            displayOrder: Number.isNaN(sortValue) ? 0 : sortValue,
            isActive: parseBoolean(isActive, true),
            startDate: parsedStart,
            endDate: parsedEnd,
            createdBy: scope.actorId,
            createdByType: scope.accountType,
        });

        return res.status(201).json({
            success: true,
            message: "Banner created successfully",
            frontendDomainUrl: scope.owner.frontendDomainUrl,
            showAllBranches: scope.showAllBranches,
            branchName: scope.branchName,
            branch: scope.branch
                ? {
                      id: scope.branch._id,
                      name: scope.branch.name,
                      branchCode: scope.branch.branchCode,
                  }
                : null,
            banner: formatBanner(banner),
        });
    } catch (error) {
        console.error("Create banner error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create banner",
        });
    }
};

export default createBanner;
export { parseOptionalDate };
