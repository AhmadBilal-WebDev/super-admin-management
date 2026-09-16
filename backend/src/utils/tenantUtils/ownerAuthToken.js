import jwt from "jsonwebtoken";

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

const createOwnerToken = (merchant) => {
    const token = jwt.sign(
        {
            id: merchant._id,
            merchantId: merchant._id,
            bussinessId: merchant.bussinessId,
            email: merchant.ownerEmail,
            accountType: "owner",
            tokenVersion: merchant.tokenVersion || 0,
        },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES_IN }
    );

    return { token };
};

export { TOKEN_EXPIRES_IN, createOwnerToken };
