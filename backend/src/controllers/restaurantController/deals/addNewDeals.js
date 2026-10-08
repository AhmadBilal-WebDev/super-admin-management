import Deal from "../../../models/restaurantModels/deal.js";
import toBussinessSlug from "../../../utils/superadminUtils/toBussinessSlug.js";
import formatDeal, {
    calcDiscountPercent,
} from "../../../utils/restaurantUtils/formatDeal.js";
import {
    assertCatalogPermission,
    parseBoolean,
    parseJsonField,
    resolveCatalogWriteScope,
} from "../../../utils/restaurantUtils/catalogScope.js";
import { normalizeCatalogTags } from "../../../constants/restaurantConstant/catalogTags.js";

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

const normalizeDealItems = (raw) => {
    if (raw === undefined || raw === null || raw === "") return [];

    const items = parseJsonField(raw, []);
    if (!Array.isArray(items)) {
        throw new Error("Deal items must be an array");
    }

    return items.map((item) => {
        const name = String(item?.name || "").trim();
        if (!name) throw new Error("Each deal item must have a name");

        return {
            name,
            quantity: Math.max(1, Number(item?.quantity) || 1),
            productId: item?.productId || null,
        };
    });
};

const addNewDeals = async (req, res) => {
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
            "catalog",
            "dealscombos"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const {
            name,
            shortDescription,
            image,
            originalPrice,
            dealPrice,
            discount,
            discountPercent,
            termsAndConditions,
            displayOrder,
            sort,
            isActive,
            status,
            startDate,
            endDate,
            slug,
        } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Deal name is required",
            });
        }

        const original = Number(originalPrice);
        const price = Number(dealPrice);

        if (Number.isNaN(original) || original < 0) {
            return res.status(400).json({
                success: false,
                message: "Valid original price is required",
            });
        }

        if (Number.isNaN(price) || price < 0) {
            return res.status(400).json({
                success: false,
                message: "Valid deal price is required",
            });
        }

        if (price > original) {
            return res.status(400).json({
                success: false,
                message: "Deal price cannot be greater than original price",
            });
        }

        const trimmedName = String(name).trim();
        const normalizedSlug = toBussinessSlug(slug || trimmedName);

        if (!normalizedSlug) {
            return res.status(400).json({
                success: false,
                message: "Deal name must contain letters or numbers",
            });
        }

        const existing = await Deal.findOne({
            merchantId: scope.owner._id,
            slug: normalizedSlug,
            showAllBranches: scope.showAllBranches,
            branchId: scope.branchId,
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: scope.showAllBranches
                    ? "Deal already exists for all branches"
                    : "Deal already exists in this branch",
            });
        }

        let parsedStart = null;
        let parsedEnd = null;
        let tags = [];
        let items = [];

        try {
            parsedStart = parseOptionalDate(startDate, "start date");
            parsedEnd = parseOptionalDate(endDate, "end date");
            items = normalizeDealItems(req.body.items);

            if (req.body.tags !== undefined) {
                tags = normalizeCatalogTags(req.body.tags);
            }
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                message: parseError.message,
            });
        }

        if (parsedStart && parsedEnd && parsedEnd < parsedStart) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date",
            });
        }

        let finalDiscount = calcDiscountPercent(original, price);
        const rawDiscount =
            discountPercent !== undefined ? discountPercent : discount;

        if (rawDiscount !== undefined && rawDiscount !== null && rawDiscount !== "") {
            const parsedDiscount = Number(
                String(rawDiscount).replace(/%/g, "").trim()
            );
            if (!Number.isNaN(parsedDiscount) && parsedDiscount >= 0) {
                finalDiscount = Math.min(100, parsedDiscount);
            }
        }

        const activeFromStatus =
            status !== undefined
                ? !["inactive", "false", "0", "off"].includes(
                      String(status).trim().toLowerCase()
                  )
                : true;

        const sortValue =
            sort !== undefined && sort !== ""
                ? Number(sort)
                : displayOrder !== undefined && displayOrder !== ""
                  ? Number(displayOrder)
                  : 0;

        const deal = await Deal.create({
            merchantId: scope.owner._id,
            bussinessId: scope.owner.bussinessId,
            branchId: scope.branchId,
            branchName: scope.branchName,
            showAllBranches: scope.showAllBranches,
            name: trimmedName,
            slug: normalizedSlug,
            shortDescription: shortDescription
                ? String(shortDescription).trim()
                : "",
            image: image ? String(image).trim() : "",
            originalPrice: original,
            dealPrice: price,
            discountPercent: finalDiscount,
            tags,
            items,
            termsAndConditions: termsAndConditions
                ? String(termsAndConditions).trim()
                : "",
            displayOrder: Number.isNaN(sortValue) ? 0 : sortValue,
            isActive: parseBoolean(isActive, activeFromStatus),
            startDate: parsedStart,
            endDate: parsedEnd,
            createdBy: scope.actorId,
            createdByType: scope.accountType,
        });

        return res.status(201).json({
            success: true,
            message: "Deal created successfully",
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
            deal: formatDeal(deal),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Deal already exists for this branch scope",
            });
        }

        console.error("Create deal error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create deal",
        });
    }
};

export default addNewDeals;
export { parseOptionalDate, normalizeDealItems };
