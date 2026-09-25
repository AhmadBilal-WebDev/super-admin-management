import crypto from "crypto";
import jwt from "jsonwebtoken";

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

const createStaffToken = (staff) => {
    const jti = crypto.randomUUID();

    const token = jwt.sign(
        {
            id: staff._id,
            staffId: staff._id,
            merchantId: staff.merchantId,
            bussinessId: staff.bussinessId,
            email: staff.email,
            accountType: "staff",
            tokenVersion: staff.tokenVersion || 0,
            jti,
        },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES_IN }
    );

    return { token, jti };
};

export { TOKEN_EXPIRES_IN, createStaffToken };
