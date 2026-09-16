const getCloudinaryPublicId = (imageUrl) => {
    if (!imageUrl) return null;

    try {
        const uploadPart = imageUrl.split("/upload/")[1];
        if (!uploadPart) return null;

        const withoutVersion = uploadPart.replace(/^v\d+\//, "");
        return withoutVersion.replace(/\.[^/.]+$/, "");
    } catch {
        return null;
    }
};

export default getCloudinaryPublicId;
