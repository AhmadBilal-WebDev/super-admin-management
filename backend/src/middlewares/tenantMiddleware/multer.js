import multer from "multer";
import path from "path";

const storage = multer.diskStorage({});

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const isImageMime = file.mimetype?.startsWith("image/");
    const isAllowedExt = allowedExtensions.includes(ext);

    if (isImageMime || isAllowedExt) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1 * 1024 * 1024, // 1 MB
    },
});

export default upload;
