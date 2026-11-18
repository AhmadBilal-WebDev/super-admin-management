import mongoose from "mongoose";
import Product from "../../models/restaurantModels/product.js";
import {
    resolveBranchForMerchant,
    buildBranchVisibilityFilter,
} from "./catalogScope.js";

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const productAvailableForBranch = (product, branch) => {
    if (product.showAllBranches === true) return true;
    if (product.branchId && String(product.branchId) === String(branch._id)) {
        return true;
    }
    const names = Array.isArray(product.branchName) ? product.branchName : [];
    return names.some(
        (name) =>
            String(name || "").trim().toLowerCase() ===
            String(branch.name || "").trim().toLowerCase()
    );
};

const resolveUnitPrice = (product, variant) => {
    if (variant) {
        if (
            variant.discountPrice !== undefined &&
            variant.discountPrice !== null &&
            Number(variant.discountPrice) >= 0
        ) {
            return Number(variant.discountPrice);
        }
        return Number(variant.price) || 0;
    }

    if (
        product.discountPrice !== undefined &&
        product.discountPrice !== null &&
        Number(product.discountPrice) >= 0
    ) {
        return Number(product.discountPrice);
    }

    return Number(product.price) || 0;
};

const normalizeAddonKey = (addons = []) =>
    (Array.isArray(addons) ? addons : [])
        .map((addon) => ({
            addonId: String(addon.addonId || addon.id || "").trim(),
            quantity: Number(addon.quantity || 1),
        }))
        .filter((addon) => addon.addonId)
        .sort((a, b) => a.addonId.localeCompare(b.addonId))
        .map((addon) => `${addon.addonId}:${addon.quantity}`)
        .join("|");

const cartItemKey = (item = {}) => {
    const productId = String(item.productId || "").trim();
    const variantId = String(item.variantId || item.variant?.variantId || "").trim();
    const notes = String(item.notes || "").trim().toLowerCase();
    return `${productId}::${variantId}::${normalizeAddonKey(item.addons)}::${notes}`;
};

const findVariant = (product, variantId, variantName = "") => {
    if (variantId) {
        if (typeof product.variants?.id === "function") {
            const byId = product.variants.id(variantId);
            if (byId) return byId;
        }
        const matched = (product.variants || []).find(
            (item) => String(item._id) === String(variantId)
        );
        if (matched) return matched;
    }

    const name = String(variantName || "").trim().toLowerCase();
    if (!name) return null;

    // Skip frontend placeholder tokens like "nocheese"
    if (["nocheese", "no-cheese", "none", "null", "undefined"].includes(name)) {
        return null;
    }

    return (product.variants || []).find((item) => {
        if (item.isActive === false) return false;
        const candidates = [item.name, item.size, item.portion]
            .map((value) => String(value || "").trim().toLowerCase())
            .filter(Boolean);
        return candidates.includes(name);
    });
};

const findAddon = (product, addonId, addonName = "") => {
    if (addonId) {
        if (typeof product.addons?.id === "function") {
            const byId = product.addons.id(addonId);
            if (byId) return byId;
        }
        const matched = (product.addons || []).find(
            (item) => String(item._id) === String(addonId)
        );
        if (matched) return matched;
    }

    const name = String(addonName || "").trim().toLowerCase();
    if (!name) return null;

    return (product.addons || []).find(
        (item) =>
            item.isActive !== false &&
            String(item.name || "").trim().toLowerCase() === name
    );
};

/**
 * Normalize frontend localStorage cart shape into API cart lines.
 * Supports:
 * {
 *   cartItemId, product:{id}, quantity, selectedBun, selectedAddons,
 *   specialInstructions, unitPrice, totalPrice
 * }
 */
const normalizeLocalCartItems = (rawItems = []) => {
    if (!Array.isArray(rawItems)) return [];

    return rawItems
        .map((raw) => {
            if (!raw || typeof raw !== "object") return null;

            const productId =
                raw.productId ||
                raw.product?.id ||
                raw.product?._id ||
                raw.productId?._id ||
                "";

            const variantId =
                raw.variantId ||
                raw.variant?.variantId ||
                raw.variant?.id ||
                raw.variant?._id ||
                raw.selectedVariantId ||
                "";

            const variantName =
                raw.variantName ||
                raw.selectedBun ||
                raw.bun ||
                raw.size ||
                raw.variant?.name ||
                raw.variant?.size ||
                "";

            const notes =
                raw.notes ||
                raw.specialInstructions ||
                raw.instruction ||
                raw.special_instructions ||
                "";

            const addonsSource = Array.isArray(raw.addons)
                ? raw.addons
                : Array.isArray(raw.selectedAddons)
                  ? raw.selectedAddons
                  : [];

            const addons = addonsSource
                .map((addon) => {
                    if (!addon) return null;
                    if (typeof addon === "string") {
                        // could be id or name
                        if (mongoose.Types.ObjectId.isValid(addon)) {
                            return { addonId: addon, quantity: 1 };
                        }
                        return { name: addon, quantity: 1 };
                    }

                    return {
                        addonId:
                            addon.addonId ||
                            addon.id ||
                            addon._id ||
                            undefined,
                        name: addon.name || "",
                        quantity: Number(addon.quantity || 1),
                    };
                })
                .filter(Boolean);

            return {
                productId: String(productId || "").trim(),
                quantity: Number(raw.quantity || 1),
                variantId: variantId ? String(variantId).trim() : undefined,
                variantName: String(variantName || "").trim(),
                addons,
                notes: String(notes || "").trim(),
                // keep local key for debugging only
                cartItemId: raw.cartItemId || "",
            };
        })
        .filter((item) => item && item.productId);
};

const buildSingleCartLine = (product, raw = {}, index = 0) => {
    const quantity = Number(raw.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
        return {
            error: `Invalid quantity at item ${index + 1}`,
        };
    }

    if (product.availabilityStatus !== "available") {
        return {
            error: `${product.name} is ${String(product.availabilityStatus || "unavailable").replaceAll("_", " ")}`,
        };
    }

    const variantId = raw.variantId || raw.variant?.variantId || null;
    const variantName =
        raw.variantName ||
        raw.selectedBun ||
        raw.bun ||
        raw.size ||
        raw.variant?.name ||
        "";

    let variant = findVariant(product, variantId, variantName);

    // selectedBun provided but not found on product
    if ((variantId || variantName) && !variant) {
        // If only a placeholder like nocheese was sent via name, ignore
        const name = String(variantName || "").trim().toLowerCase();
        if (
            variantId ||
            (name &&
                !["nocheese", "no-cheese", "none", "null", "undefined"].includes(
                    name
                ))
        ) {
            return {
                error: `Invalid variant/size "${variantName || variantId}" for ${product.name}`,
            };
        }
    }

    const unitPrice = resolveUnitPrice(product, variant);
    const basePrice = variant
        ? Number(variant.price) || 0
        : Number(product.price) || 0;
    const discountPrice = variant
        ? variant.discountPrice ?? null
        : product.discountPrice ?? null;

    const selectedAddons = [];
    let addonsTotal = 0;
    const rawAddons = Array.isArray(raw.addons)
        ? raw.addons
        : Array.isArray(raw.selectedAddons)
          ? raw.selectedAddons
          : [];

    for (const rawAddon of rawAddons) {
        const addonId = rawAddon?.addonId || rawAddon?.id || rawAddon?._id;
        const addonName = rawAddon?.name || "";
        const addonQty = Number(rawAddon?.quantity || 1);

        if ((!addonId && !addonName) || !Number.isFinite(addonQty) || addonQty < 1) {
            return { error: `Invalid addon on ${product.name}` };
        }

        const addon = findAddon(product, addonId, addonName);
        if (!addon || addon.isActive === false) {
            return {
                error: `Addon not available on ${product.name}${
                    addonName ? `: ${addonName}` : ""
                }`,
            };
        }

        if (addonQty > (addon.maxQuantity || 1)) {
            return {
                error: `Addon ${addon.name} max quantity is ${addon.maxQuantity || 1}`,
            };
        }

        const addonLine = roundMoney(Number(addon.price) * addonQty);
        addonsTotal += addonLine;
        selectedAddons.push({
            addonId: addon._id,
            name: addon.name,
            price: Number(addon.price) || 0,
            quantity: addonQty,
            lineTotal: addonLine,
        });
    }

    const requiredAddons = (product.addons || []).filter(
        (addon) => addon.isRequired === true && addon.isActive !== false
    );

    for (const required of requiredAddons) {
        const selected = selectedAddons.find(
            (addon) => String(addon.addonId) === String(required._id)
        );
        if (!selected) {
            return {
                error: `Required addon missing: ${required.name} on ${product.name}`,
            };
        }
    }

    const lineSubtotal = roundMoney((unitPrice + addonsTotal) * quantity);
    const lineTax = roundMoney(
        ((Number(product.tax) || 0) / 100) * lineSubtotal
    );
    const lineTotal = roundMoney(lineSubtotal + lineTax);

    return {
        item: {
            productId: product._id,
            categoryId: product.categoryId || null,
            name: product.name,
            sku: product.sku || "",
            image: product.image || "",
            quantity,
            unitPrice: roundMoney(unitPrice),
            basePrice: roundMoney(basePrice),
            discountPrice:
                discountPrice === null || discountPrice === undefined
                    ? null
                    : roundMoney(discountPrice),
            tax: Number(product.tax) || 0,
            variantId: variant?._id || null,
            variant: variant
                ? {
                      variantId: variant._id,
                      name: variant.name || "",
                      size: variant.size || "",
                      portion: variant.portion || "",
                      price: Number(variant.price) || 0,
                  }
                : {
                      variantId: null,
                      name: "",
                      size: "",
                      portion: "",
                      price: null,
                  },
            addons: selectedAddons,
            notes: String(raw.notes || "").trim(),
            lineSubtotal,
            lineTax,
            lineTotal,
        },
    };
};

const recalculateCartTotals = (items = []) => {
    const list = Array.isArray(items) ? items : [];
    let subtotal = 0;
    let taxTotal = 0;
    let itemsCount = 0;

    for (const item of list) {
        subtotal += Number(item.lineSubtotal) || 0;
        taxTotal += Number(item.lineTax) || 0;
        itemsCount += Number(item.quantity) || 0;
    }

    return {
        itemsCount,
        subtotal: roundMoney(subtotal),
        taxTotal: roundMoney(taxTotal),
        grandTotal: roundMoney(subtotal + taxTotal),
    };
};

const mergeCartItemLists = (existingItems = [], incomingItems = []) => {
    const merged = [...(existingItems || [])];

    for (const incoming of incomingItems || []) {
        const key = cartItemKey(incoming);
        const foundIndex = merged.findIndex((item) => cartItemKey(item) === key);

        if (foundIndex === -1) {
            merged.push(incoming);
            continue;
        }

        const current = merged[foundIndex];
        const nextQty =
            (Number(current.quantity) || 0) + (Number(incoming.quantity) || 0);

        const rebuilt = {
            ...current,
            quantity: nextQty,
        };

        // Recompute money from unit prices already on line
        const addonsTotal = (rebuilt.addons || []).reduce(
            (sum, addon) =>
                sum + (Number(addon.price) || 0) * (Number(addon.quantity) || 1),
            0
        );
        const lineSubtotal = roundMoney(
            ((Number(rebuilt.unitPrice) || 0) + addonsTotal) * nextQty
        );
        const lineTax = roundMoney(
            ((Number(rebuilt.tax) || 0) / 100) * lineSubtotal
        );

        rebuilt.lineSubtotal = lineSubtotal;
        rebuilt.lineTax = lineTax;
        rebuilt.lineTotal = roundMoney(lineSubtotal + lineTax);
        merged[foundIndex] = rebuilt;
    }

    return merged;
};

const buildValidatedCartItems = async ({
    merchant,
    branchId,
    branchName,
    items,
}) => {
    if (!branchId && !branchName) {
        return { error: { status: 400, message: "branchId or branchName is required" } };
    }

    const normalizedItems = normalizeLocalCartItems(items);

    if (!normalizedItems.length) {
        return { error: { status: 400, message: "At least one cart item is required" } };
    }

    const branchResult = await resolveBranchForMerchant(merchant, {
        branchId,
        branchName,
    });

    if (branchResult.error) {
        return { error: branchResult.error };
    }

    const branch = branchResult.branch;
    if (branch.isActive === false) {
        return {
            error: { status: 400, message: "This branch is inactive" },
        };
    }

    const uniqueProductIds = [
        ...new Set(
            normalizedItems
                .map((item) => String(item?.productId || "").trim())
                .filter((id) => mongoose.Types.ObjectId.isValid(id))
        ),
    ];

    if (!uniqueProductIds.length) {
        return {
            error: { status: 400, message: "Valid product ids are required" },
        };
    }

    const visibility = buildBranchVisibilityFilter({
        merchantId: merchant._id,
        branch,
        showAllOnly: false,
    });

    const products = await Product.find({
        ...visibility,
        _id: { $in: uniqueProductIds },
        isActive: true,
    });

    const productMap = new Map(
        products.map((product) => [String(product._id), product])
    );

    const builtItems = [];

    for (let index = 0; index < normalizedItems.length; index += 1) {
        const raw = normalizedItems[index] || {};
        const productId = String(raw.productId || "").trim();

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return {
                error: {
                    status: 400,
                    message: `Invalid productId at item ${index + 1}`,
                },
            };
        }

        const product = productMap.get(productId);
        if (!product || !productAvailableForBranch(product, branch)) {
            return {
                error: {
                    status: 400,
                    message: `Product not available for this branch (item ${index + 1})`,
                },
            };
        }

        const built = buildSingleCartLine(product, raw, index);
        if (built.error) {
            return { error: { status: 400, message: built.error } };
        }

        builtItems.push(built.item);
    }

    const totals = recalculateCartTotals(builtItems);

    return {
        branch,
        items: builtItems,
        ...totals,
    };
};

export {
    roundMoney,
    cartItemKey,
    normalizeLocalCartItems,
    buildSingleCartLine,
    recalculateCartTotals,
    mergeCartItemLists,
    buildValidatedCartItems,
    productAvailableForBranch,
    resolveUnitPrice,
};
export default buildValidatedCartItems;
