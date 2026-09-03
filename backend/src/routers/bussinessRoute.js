import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import addBussiness from "../controllers/bussiness/addBussiness.js";
import addMerchant from "../controllers/bussiness/addMerchant.js";
import getMerchantsByBussiness from "../controllers/bussiness/getMerchantsByBussiness.js";
import updateMerchant from "../controllers/bussiness/updateMerchant.js";
import deleteMerchant from "../controllers/bussiness/deleteMerchant.js";
import updateBussiness from "../controllers/bussiness/updateBussiness.js";
import deleteBussiness from "../controllers/bussiness/deleteBussiness.js";

const router = express.Router();

router.post("/superadmin/add-bussiness", authMiddleware, addBussiness);
router.post(
    "/superadmin/bussiness/:bussinessId/add-merchant",
    authMiddleware,
    addMerchant
);
router.get(
    "/superadmin/bussiness/:bussinessId/merchants",
    authMiddleware,
    getMerchantsByBussiness
);
router.put(
    "/superadmin/bussiness/:bussinessId/update-merchant/:merchantId",
    authMiddleware,
    updateMerchant
);
router.delete(
    "/superadmin/bussiness/:bussinessId/delete-merchant/:merchantId",
    authMiddleware,
    deleteMerchant
);
router.put("/superadmin/update-bussiness/:id", authMiddleware, updateBussiness);
router.delete("/superadmin/delete-bussiness/:id", authMiddleware, deleteBussiness);

export default router;
