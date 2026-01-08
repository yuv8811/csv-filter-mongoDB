export const safeParseDate = (d) => {
    if (!d) return null;
    let parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed;

    const parts = d.split(/[-/]/);
    if (parts.length === 3) {
        if (parts[2].length === 4) {
            parsed = new Date(parts[2], parts[1] - 1, parts[0]);
            if (!isNaN(parsed.getTime())) return parsed;
        }
        if (parts[0].length === 4) {
            parsed = new Date(parts[0], parts[1] - 1, parts[2]);
            if (!isNaN(parsed.getTime())) return parsed;
        }
    }
    return null;
};

export const normalizeDomain = (domain = "") => {
    if (!domain) return "";
    return domain.endsWith(".myshopify.com")
        ? domain
        : `${domain}.myshopify.com`;
};
