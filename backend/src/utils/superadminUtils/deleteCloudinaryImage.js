import cloudinary from "./cloudinary.js";
import getCloudinaryPublicId from "./getCloudinaryPublicId.js";

const deleteCloudinaryImage = async (imageUrl) => {
    const publicId = getCloudinaryPublicId(imageUrl);

    if (!publicId) {
        return false;
    }

    await cloudinary.uploader.destroy(publicId);
    return true;
};

export default deleteCloudinaryImage;
