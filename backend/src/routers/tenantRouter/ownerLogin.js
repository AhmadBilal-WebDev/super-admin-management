import express from "express";
import ownerLogin from "../../controllers/tenantController/ownerLogin.js";
import verifyOwnerEmail from "../../controllers/tenantController/verifyOwnerEmail.js";
import setOwnerPassword from "../../controllers/tenantController/setOwnerPassword.js";
import ownerForgotPassword from "../../controllers/tenantController/ownerForgotPassword.js";
import verifyOwnerForgotOtp from "../../controllers/tenantController/verifyOwnerForgotOtp.js";
import resetOwnerPassword from "../../controllers/tenantController/resetOwnerPassword.js";

const router = express.Router();

router.post("/owner/login", ownerLogin);
router.post("/owner/verify-email", verifyOwnerEmail);
router.post("/owner/set-password", setOwnerPassword);

router.post("/owner/forgot-password", ownerForgotPassword);
router.post("/owner/verify-forgot-otp", verifyOwnerForgotOtp);
router.post("/owner/reset-password", resetOwnerPassword);

export default router;
