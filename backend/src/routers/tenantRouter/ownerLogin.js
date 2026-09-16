import express from "express";
import ownerLogin from "../../controllers/tenantController/ownerLogin.js";
import verifyOwnerEmail from "../../controllers/tenantController/verifyOwnerEmail.js";
import setOwnerPassword from "../../controllers/tenantController/setOwnerPassword.js";

const router = express.Router();

router.post("/owner/login", ownerLogin);
router.post("/owner/verify-email", verifyOwnerEmail);
router.post("/owner/set-password", setOwnerPassword);

export default router;
