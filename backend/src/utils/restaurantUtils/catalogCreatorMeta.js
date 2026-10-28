const buildCatalogCreatorMeta = ({ accountType, account, owner, actorId }) => {
    if (accountType === "staff") {
        const name =
            `${account?.firstName || ""} ${account?.lastName || ""}`.trim() ||
            account?.email ||
            "Staff";

        return {
            createdBy: actorId || account?._id || null,
            createdByType: "staff",
            createdByName: name,
            createdByRole: account?.roleName || "Staff",
            createdByStaffType: account?.staffType || "staff",
        };
    }

    const ownerName =
        `${owner?.ownerFirstName || ""} ${owner?.ownerLastName || ""}`.trim() ||
        owner?.name ||
        "Owner";

    return {
        createdBy: actorId || owner?._id || null,
        createdByType: "owner",
        createdByName: ownerName,
        createdByRole: "Owner",
        createdByStaffType: "",
    };
};

const formatCreatedByDetails = (doc = {}) => ({
    createdBy: doc.createdBy || null,
    createdByType: doc.createdByType || "owner",
    createdByName: doc.createdByName || "",
    createdByRole: doc.createdByRole || (doc.createdByType === "staff" ? "Staff" : "Owner"),
    createdByStaffType: doc.createdByStaffType || "",
});

export { buildCatalogCreatorMeta, formatCreatedByDetails };
export default buildCatalogCreatorMeta;
