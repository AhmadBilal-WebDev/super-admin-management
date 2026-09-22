import express from "express";
import ownerAuthMiddleware from "../../middlewares/tenantMiddleware/ownerAuthMiddleware.js";
import getSidebarButtons from "../../controllers/restaurantController/getSidebarButtons.js";

const router = express.Router();

router.get("/sidebar-buttons", ownerAuthMiddleware, getSidebarButtons);

export default router;
