const errorHandler = (err, req, res, next) => {
    if (err?.code === "LIMIT_FILE_SIZE" || err?.type === "entity.too.large") {
        return res.status(400).json({
            success: false,
            message: "Image size must be 1 MB or less",
        });
    }

    if (err?.message === "Only image files are allowed") {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    console.error("Unhandled error:", err);

    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Server error",
    });
};

export default errorHandler;
