const CATALOG_TAGS = [
    { key: "featured", label: "Featured", emoji: "⭐" },
    { key: "popular", label: "Popular", emoji: "🔥" },
    { key: "new", label: "New", emoji: "🆕" },
    { key: "recommended", label: "Recommended", emoji: "❤️" },
    { key: "bestseller", label: "Best Seller", emoji: "🏷️" },
    { key: "deal", label: "Deal", emoji: "🎁" },
    { key: "spicy", label: "Spicy", emoji: "🌶️" },
    { key: "healthy", label: "Healthy", emoji: "🥗" },
    { key: "vegetarian", label: "Vegetarian", emoji: "🌱" },
    { key: "nonvegetarian", label: "Non-Vegetarian", emoji: "🥩" },
    { key: "limitedtime", label: "Limited Time", emoji: "⏰" },
    { key: "outofstock", label: "Out of Stock", emoji: "🔴" },
];

const TAG_MAP = new Map(CATALOG_TAGS.map((tag) => [tag.key, tag]));

const getCatalogTagCatalog = () =>
    CATALOG_TAGS.map(({ key, label, emoji }) => ({ key, label, emoji }));

const normalizeTagKey = (value) => {
    const raw = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/_/g, "")
        .replace(/-/g, "");

    if (!raw) return null;
    if (raw === "outofstock" || raw === "outofstock") return "outofstock";
    return TAG_MAP.has(raw) ? raw : null;
};

const normalizeCatalogTags = (rawTags) => {
    let parsed = rawTags;

    if (typeof rawTags === "string") {
        const trimmed = rawTags.trim();
        if (!trimmed) parsed = [];
        else if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
            parsed = JSON.parse(trimmed);
        } else {
            parsed = trimmed.split(",").map((item) => item.trim());
        }
    }

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        parsed = Object.entries(parsed)
            .filter(([, enabled]) => enabled === true || enabled === "true")
            .map(([key]) => key);
    }

    if (!Array.isArray(parsed)) {
        throw new Error("Tags must be an array of tag keys");
    }

    const keys = [];
    const seen = new Set();

    for (const item of parsed) {
        const key =
            typeof item === "object" && item !== null
                ? normalizeTagKey(item.key)
                : normalizeTagKey(item);

        if (!key) {
            const invalid =
                typeof item === "object" && item !== null ? item.key : item;
            throw new Error(`Invalid catalog tag: ${invalid}`);
        }

        if (!seen.has(key)) {
            seen.add(key);
            keys.push(key);
        }
    }

    return keys;
};

const formatCatalogTags = (keys = []) =>
    (Array.isArray(keys) ? keys : [])
        .map((key) => TAG_MAP.get(String(key)))
        .filter(Boolean)
        .map((tag) => ({
            key: tag.key,
            label: tag.label,
            emoji: tag.emoji,
            isActive: true,
        }));

const mergeTagsWithFlags = ({
    tags,
    isFeatured,
    isRecommended,
    availabilityStatus,
} = {}) => {
    const merged = new Set(Array.isArray(tags) ? tags : []);

    if (isFeatured === true) merged.add("featured");
    if (isFeatured === false) merged.delete("featured");

    if (isRecommended === true) merged.add("recommended");
    if (isRecommended === false) merged.delete("recommended");

    if (availabilityStatus === "out_of_stock") merged.add("outofstock");
    if (availabilityStatus === "available") merged.delete("outofstock");

    return [...merged];
};

const syncFlagsFromTags = (tags = []) => ({
    isFeatured: tags.includes("featured"),
    isRecommended: tags.includes("recommended"),
    availabilityStatus: tags.includes("outofstock")
        ? "out_of_stock"
        : undefined,
});

export {
    CATALOG_TAGS,
    getCatalogTagCatalog,
    normalizeCatalogTags,
    formatCatalogTags,
    mergeTagsWithFlags,
    syncFlagsFromTags,
};
