const toPermissionNode = (item) => {
    if (item === null || item === undefined) {
        return null;
    }

    if (typeof item === "string" || typeof item === "number") {
        const key = String(item).trim();
        return key ? { key, allowAll: false, buttons: [] } : null;
    }

    if (typeof item !== "object") {
        return null;
    }

    const key =
        item.key !== undefined && item.key !== null ? String(item.key).trim() : "";

    if (!key) {
        return null;
    }

    const rawButtons = Array.isArray(item.buttons) ? item.buttons : [];

    return {
        key,
        allowAll: item.allowAll === true || item.allowAll === "true",
        buttons: rawButtons.map(toPermissionNode).filter(Boolean),
    };
};

const toPermissionNodes = (items) =>
    (Array.isArray(items) ? items : []).map(toPermissionNode).filter(Boolean);

const mergePermissionNodes = (nodes) => {
    const merged = new Map();

    for (const node of nodes) {
        const existing = merged.get(node.key);

        if (!existing) {
            merged.set(node.key, {
                key: node.key,
                allowAll: node.allowAll,
                buttons: [...node.buttons],
            });
            continue;
        }

        existing.allowAll = existing.allowAll || node.allowAll;
        existing.buttons = mergePermissionNodes([
            ...existing.buttons,
            ...node.buttons,
        ]);
    }

    return [...merged.values()];
};

export { toPermissionNode, toPermissionNodes, mergePermissionNodes };
