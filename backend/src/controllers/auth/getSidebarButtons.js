import { getAuthorizedSidebar } from "../../constants/sidebarCatalog.js";

const getSidebarButtons = async (req, res) => {
    try {
        const sidebar = getAuthorizedSidebar(req.user);

        return res.status(200).json({
            success: true,
            message: "Sidebar buttons fetched successfully",
            sidebar,
        });
    } catch (error) {
        console.error("Get sidebar buttons error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export default getSidebarButtons;
