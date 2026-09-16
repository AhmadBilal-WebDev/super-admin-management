const logout = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
            email: req.user.email,
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to logout",
        });
    }
};

export default logout;
