import crypto from "crypto";
import jwt from "jsonwebtoken";

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

const hashToken = (token) =>
    crypto.createHash("sha256").update(String(token)).digest("hex");

const getOwnerTokenKey = (token, decoded = {}) =>
    decoded.jti || hashToken(token);

const getOwnerTokenExpiryDate = (decoded = {}) => {
    if (decoded.exp) {
        return new Date(decoded.exp * 1000);
    }

    return new Date(Date.now() + 60 * 60 * 1000);
};

const createOwnerToken = (merchant) => {
    const jti = crypto.randomUUID();

    const token = jwt.sign(
        {
            id: merchant._id,
            merchantId: merchant._id,
            bussinessId: merchant.bussinessId,
            email: merchant.ownerEmail,
            accountType: "owner",
            tokenVersion: merchant.tokenVersion || 0,
            jti,
        },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES_IN }
    );

    return { token, jti };
};

export {
    TOKEN_EXPIRES_IN,
    hashToken,
    getOwnerTokenKey,
    getOwnerTokenExpiryDate,
    createOwnerToken,
};
