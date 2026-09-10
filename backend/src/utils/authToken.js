import jwt from "jsonwebtoken";

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

const createAuthToken = (user) => {
    const token = jwt.sign(
        {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            tokenVersion: user.tokenVersion,
        },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES_IN }
    );

    return { token };
};

export { TOKEN_EXPIRES_IN, createAuthToken };
