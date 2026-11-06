const userLogout = async (req, res) => {
    try {
        const customer = req.customer;
        customer.tokenVersion = (customer.tokenVersion || 0) + 1;
        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("User logout error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to logout",
        });
    }
};

export default userLogout;
