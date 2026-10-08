import Deal from "../../../models/restaurantModels/deal.js";
import toBussinessSlug from "../../../utils/superadminUtils/toBussinessSlug.js";
import formatDeal, {
    calcDiscountPercent,
} from "../../../utils/restaurantUtils/formatDeal.js";
import {
    parseOptionalDate,
    normalizeDealItems,
} from "./addNewDeals.js";
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
import { normalizeCatalogTags } from "../../../constants/restaurantConstant/catalogTags.js";

const updateDeal = async (req, res) => {
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
            "catalog",
            "dealscombos"
        );

        if (permissionCheck.error) {
            return res.status(permissionCheck.error.status).json({
                success: false,
                message: permissionCheck.error.message,
            });
        }

        const deal = await Deal.findOne({
            _id: req.params.id,
            merchantId: owner._id,
        });

        if (!deal) {
            return res.status(404).json({
                success: false,
                message: "Deal not found",
            });
        }

        const update = {};

        if (req.body.name !== undefined) {
            const trimmed = String(req.body.name).trim();
            if (!trimmed) {
                return res.status(400).json({
                    success: false,
                    message: "Deal name is required",
                });
            }
            update.name = trimmed;
            if (req.body.slug === undefined) {
                update.slug = toBussinessSlug(trimmed);
            }
        }

        if (req.body.slug !== undefined) {
            const normalizedSlug = toBussinessSlug(req.body.slug);
            if (!normalizedSlug) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid deal slug",
                });
            }
            update.slug = normalizedSlug;
        }

        if (req.body.shortDescription !== undefined) {
            update.shortDescription = String(
                req.body.shortDescription || ""
            ).trim();
        }

        if (req.body.image !== undefined) {
            update.image = String(req.body.image || "").trim();
        }

        if (req.body.originalPrice !== undefined) {
            const original = Number(req.body.originalPrice);
            if (Number.isNaN(original) || original < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Valid original price is required",
                });
            }
            update.originalPrice = original;
        }

        if (req.body.dealPrice !== undefined) {
            const price = Number(req.body.dealPrice);
            if (Number.isNaN(price) || price < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Valid deal price is required",
                });
            }
            update.dealPrice = price;
        }

        const nextOriginal =
            update.originalPrice !== undefined
                ? update.originalPrice
                : deal.originalPrice;
        const nextDealPrice =
            update.dealPrice !== undefined ? update.dealPrice : deal.dealPrice;

        if (nextDealPrice > nextOriginal) {
            return res.status(400).json({
                success: false,
                message: "Deal price cannot be greater than original price",
            });
        }

        const rawDiscount =
            req.body.discountPercent !== undefined
                ? req.body.discountPercent
                : req.body.discount;

        if (rawDiscount !== undefined && rawDiscount !== null && rawDiscount !== "") {
            const parsedDiscount = Number(
                String(rawDiscount).replace(/%/g, "").trim()
            );
            if (Number.isNaN(parsedDiscount) || parsedDiscount < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid discount percent",
                });
            }
            update.discountPercent = Math.min(100, parsedDiscount);
        } else if (
            update.originalPrice !== undefined ||
            update.dealPrice !== undefined
        ) {
            update.discountPercent = calcDiscountPercent(
                nextOriginal,
                nextDealPrice
            );
        }

        if (req.body.termsAndConditions !== undefined) {
            update.termsAndConditions = String(
                req.body.termsAndConditions || ""
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
            update.isActive = parseBoolean(req.body.isActive, deal.isActive);
        }

        if (req.body.status !== undefined) {
            update.isActive = !["inactive", "false", "0", "off"].includes(
                String(req.body.status).trim().toLowerCase()
            );
        }

        try {
            if (req.body.startDate !== undefined) {
                update.startDate = parseOptionalDate(
                    req.body.startDate,
                    "start date"
                );
            }
            if (req.body.endDate !== undefined) {
                update.endDate = parseOptionalDate(req.body.endDate, "end date");
            }
            if (req.body.items !== undefined) {
                update.items = normalizeDealItems(req.body.items);
            }
            if (req.body.tags !== undefined) {
                update.tags = normalizeCatalogTags(req.body.tags);
            }
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                message: parseError.message,
            });
        }

        const nextStart =
            update.startDate !== undefined ? update.startDate : deal.startDate;
        const nextEnd =
            update.endDate !== undefined ? update.endDate : deal.endDate;

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

        const nextSlug = update.slug || deal.slug;
        const nextShowAll =
            update.showAllBranches !== undefined
                ? update.showAllBranches
                : deal.showAllBranches;
        const nextBranchId =
            update.branchId !== undefined ? update.branchId : deal.branchId;

        if (
            update.slug !== undefined ||
            update.showAllBranches !== undefined ||
            update.branchId !== undefined
        ) {
            const duplicate = await Deal.findOne({
                _id: { $ne: deal._id },
                merchantId: owner._id,
                slug: nextSlug,
                showAllBranches: nextShowAll,
                branchId: nextBranchId,
            });

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: "Deal already exists for this branch scope",
                });
            }
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No deal fields provided to update",
            });
        }

        Object.assign(deal, update);
        await deal.save();

        return res.status(200).json({
            success: true,
            message: "Deal updated successfully",
            frontendDomainUrl: owner.frontendDomainUrl,
            deal: formatDeal(deal),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Deal already exists for this branch scope",
            });
        }

        console.error("Update deal error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update deal",
        });
    }
};

export default updateDeal;
