import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import addBussiness from "../controllers/bussiness/addBussiness.js";
import updateBussiness from "../controllers/bussiness/updateBussiness.js";
import deleteBussiness from "../controllers/bussiness/deleteBussiness.js";

const router = express.Router();

router.post("/superadmin/add-bussiness", authMiddleware, addBussiness);
router.put("/superadmin/update-bussiness/:id", authMiddleware, updateBussiness);
router.delete("/superadmin/delete-bussiness/:id", authMiddleware, deleteBussiness);

export default router;
