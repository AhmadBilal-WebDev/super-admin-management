import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import LoginSuperAdmin from "../../models/auth/login.js";
import { getAuthorizedSidebar } from "../../constants/sidebarCatalog.js";
import getPublicUser from "../../utils/getPublicUser.js";

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await LoginSuperAdmin.findOne({
            email: email.toLowerCase().trim(),
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Account is inactive. Contact Super Admin",
            });
        }

        if (user.isEmailVerified === false) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first",
            });
        }

        if (user.isPasswordSet === false) {
            return res.status(403).json({
                success: false,
                message: "Please set your new password first",
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
        if (user.gender) {
            user.gender = String(user.gender).toLowerCase();
        }
        if (user.isActive === undefined) {
            user.isActive = true;
        }
        await user.save();

        const payload = getPublicUser(user);
        payload.tokenVersion = user.tokenVersion;

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                tokenVersion: user.tokenVersion,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: payload,
            sidebar: getAuthorizedSidebar(user),
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
