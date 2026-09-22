import {
    getRestaurantSidebarForUser,
    getFullRestaurantSidebar,
} from "../../constants/restaurantConstant/sidebarCatalog.js";

const getSidebarButtons = async (req, res) => {
    try {
        const sidebar = getRestaurantSidebarForUser(req.owner);
        const catalog = getFullRestaurantSidebar();

        return res.status(200).json({
            success: true,
            message: "Restaurant sidebar buttons fetched successfully",
            sidebar,
            catalog,
        });
    } catch (error) {
        console.error("Get restaurant sidebar buttons error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

export default getSidebarButtons;
