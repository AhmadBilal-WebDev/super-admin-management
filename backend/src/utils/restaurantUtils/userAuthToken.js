import crypto from "crypto";
import jwt from "jsonwebtoken";

const TOKEN_EXPIRES_IN = process.env.CUSTOMER_JWT_EXPIRES_IN || "7d";

const createUserToken = (customer) => {
    const jti = crypto.randomUUID();

    const token = jwt.sign(
        {
            id: customer._id,
            customerId: customer._id,
            merchantId: customer.merchantId,
            bussinessId: customer.bussinessId,
            branchId: customer.branchId,
            email: customer.email,
            accountType: "customer",
            tokenVersion: customer.tokenVersion || 0,
            jti,
        },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES_IN }
    );

    return { token, jti };
};

export { TOKEN_EXPIRES_IN, createUserToken };
export default createUserToken;
