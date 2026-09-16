const toBussinessSlug = (name) =>
    String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

export default toBussinessSlug;
