import fs from "fs";
import cloudinary from "../superadminUtils/cloudinary.js";

const getSingleUploadedFile = (req, fieldNames = ["image", "img"]) => {
    if (req.file) {
        return req.file;
    }

    if (req.files && !Array.isArray(req.files)) {
        for (const field of fieldNames) {
            if (Array.isArray(req.files[field]) && req.files[field][0]) {
                return req.files[field][0];
            }
        }
    }

    if (Array.isArray(req.files) && req.files.length) {
        const matched = req.files.find((file) =>
            fieldNames.includes(file.fieldname)
        );
        return matched || req.files[0];
    }

    return null;
};

const uploadImageToCloudinary = async (file, folder) => {
    if (!file) {
        throw new Error("Image file is required");
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        throw new Error("Cloudinary is not configured in environment variables");
    }

    const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: "image",
    });

    if (file.path) {
        fs.unlink(file.path, () => {});
    }

    return result.secure_url;
};

const cleanupUploadedFile = (file) => {
    if (file?.path) {
        fs.unlink(file.path, () => {});
    }
};

export {
    getSingleUploadedFile,
    uploadImageToCloudinary,
    cleanupUploadedFile,
};
