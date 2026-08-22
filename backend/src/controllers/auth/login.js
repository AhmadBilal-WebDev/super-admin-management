import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import LoginSuperAdmin from "../../models/auth/login.js";

const getSuperAdminPayload = (user) => ({
    id: user._id,
    name: user.name || "",
    email: user.email,
    profilePitcher: user.profilePitcher || "",
    tokenVersion: user.tokenVersion,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await LoginSuperAdmin.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        const payload = getSuperAdminPayload(user);

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: payload,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export default login;
export { getSuperAdminPayload };
