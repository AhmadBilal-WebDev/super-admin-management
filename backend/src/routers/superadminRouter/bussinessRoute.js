import express from "express";
import authMiddleware from "../../middlewares/superAdminMiddleware/authMiddleware.js";
import addBussiness from "../../controllers/superadminController/bussiness/addBussiness.js";
import addMerchant from "../../controllers/superadminController/bussiness/addMerchant.js";
import addBranch from "../../controllers/superadminController/bussiness/addBranch.js";
import getMerchantsByBussiness from "../../controllers/superadminController/bussiness/getMerchantsByBussiness.js";
import updateMerchant from "../../controllers/superadminController/bussiness/updateMerchant.js";
import deleteMerchant from "../../controllers/superadminController/bussiness/deleteMerchant.js";
import updateBussiness from "../../controllers/superadminController/bussiness/updateBussiness.js";
import deleteBussiness from "../../controllers/superadminController/bussiness/deleteBussiness.js";
import toggleMerchantStatus from "../../controllers/superadminController/bussiness/toggleMerchantStatus.js";
import toggleBranchStatus from "../../controllers/superadminController/bussiness/toggleBranchStatus.js";
import updateBranch from "../../controllers/superadminController/bussiness/updateBranch.js";
import deleteBranch from "../../controllers/superadminController/bussiness/deleteBranch.js";

const router = express.Router();

router.post("/superadmin/add-bussiness", authMiddleware, addBussiness);
router.post(
    "/superadmin/bussiness/:bussinessId/add-merchant",
    authMiddleware,
    addMerchant
);
router.post(
    "/superadmin/bussiness/:bussinessId/merchant/:merchantId/add-branch",
    authMiddleware,
    addBranch
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
router.put(
    "/superadmin/bussiness/:bussinessId/merchant/:merchantId/status",
    authMiddleware,
    toggleMerchantStatus
);
router.put(
    "/superadmin/bussiness/:bussinessId/merchant/:merchantId/branch/:branchId/status",
    authMiddleware,
    toggleBranchStatus
);
router.put(
    "/superadmin/bussiness/:bussinessId/merchant/:merchantId/update-branch/:branchId",
    authMiddleware,
    updateBranch
);
router.delete(
    "/superadmin/bussiness/:bussinessId/merchant/:merchantId/delete-branch/:branchId",
    authMiddleware,
    deleteBranch
);
router.put("/superadmin/update-bussiness/:id", authMiddleware, updateBussiness);
router.delete("/superadmin/delete-bussiness/:id", authMiddleware, deleteBussiness);

export default router;
