const normalizeDomainUrl = (url) => {
    const trimmed = String(url || "").trim();
    if (!trimmed) {
        return "";
    }
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const getDomainHost = (url) => {
    try {
        const parsed = new URL(normalizeDomainUrl(url));
        return parsed.hostname.replace(/^www\./i, "").toLowerCase();
    } catch {
        return String(url || "")
            .trim()
            .replace(/^https?:\/\//i, "")
            .replace(/^www\./i, "")
            .split("/")[0]
            .toLowerCase();
    }
};

const domainsMatch = (storedUrl, requestUrl) =>
    getDomainHost(storedUrl) === getDomainHost(requestUrl);

export { normalizeDomainUrl, getDomainHost, domainsMatch };
