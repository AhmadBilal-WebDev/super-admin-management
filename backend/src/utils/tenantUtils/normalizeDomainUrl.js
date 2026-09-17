const normalizeDomainUrl = (url) => {
    const trimmed = String(url || "").trim();
    if (!trimmed) {
        return "";
    }
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const getDomainKey = (url) => {
    try {
        const parsed = new URL(normalizeDomainUrl(url));
        const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
        const port = parsed.port || "";

        // host + port so localhost:3000 !== localhost:1000
        return port ? `${hostname}:${port}` : hostname;
    } catch {
        const raw = String(url || "")
            .trim()
            .replace(/^https?:\/\//i, "")
            .replace(/^www\./i, "")
            .split("/")[0]
            .toLowerCase();

        return raw;
    }
};

const domainsMatch = (storedUrl, requestUrl) => {
    const stored = getDomainKey(storedUrl);
    const requested = getDomainKey(requestUrl);

    if (!stored || !requested) {
        return false;
    }

    return stored === requested;
};

export { normalizeDomainUrl, getDomainKey, domainsMatch };
