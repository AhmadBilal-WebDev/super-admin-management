import express from "express";
import login from "../../controllers/superadminController/auth/login.js";
import authMiddleware from "../../middlewares/superAdminMiddleware/authMiddleware.js";
import upload from "../../middlewares/superAdminMiddleware/multer.js";
import uploadProfilePitcher from "../../controllers/superadminController/auth/uploadProfilePitcher.js";
import forgotPassword from "../../controllers/superadminController/auth/forgotPassword.js";
import resetPassword from "../../controllers/superadminController/auth/resetPassword.js";
import getSidebarButtons from "../../controllers/superadminController/auth/getSidebarButtons.js";
import createRole from "../../controllers/superadminController/role/createRole.js";
import getRoles from "../../controllers/superadminController/role/getRoles.js";
import updateRole from "../../controllers/superadminController/role/updateRole.js";
import blockRole from "../../controllers/superadminController/role/blockRole.js";
import activateRole from "../../controllers/superadminController/role/activateRole.js";
import deleteRole from "../../controllers/superadminController/role/deleteRole.js";
import verifyInviteEmail from "../../controllers/superadminController/role/verifyInviteEmail.js";
import resendInviteOtp from "../../controllers/superadminController/role/resendInviteOtp.js";
import setInvitePassword from "../../controllers/superadminController/role/setInvitePassword.js";
import updateProfile from "../../controllers/superadminController/auth/updateProfile.js";
import updatePassword from "../../controllers/superadminController/auth/updatePassword.js";
import removeProfilePitcher from "../../controllers/superadminController/auth/removeProfilePitcher.js";
import logout from "../../controllers/superadminController/auth/logout.js";

const router = express.Router();

router.post("/superadmin/login", login);
router.post("/superadmin/logout", authMiddleware, logout);

router.post("/superadmin/forgot-password", forgotPassword);
router.post("/superadmin/reset-password", resetPassword);

router.get("/superadmin/sidebar-buttons", authMiddleware, getSidebarButtons);
router.get("/superadmin/roles", authMiddleware, getRoles);
router.post("/superadmin/create-role", authMiddleware, createRole);
router.put("/superadmin/update-role/:id", authMiddleware, updateRole);
router.put("/superadmin/block-role/:id", authMiddleware, blockRole);
router.put("/superadmin/activate-role/:id", authMiddleware, activateRole);
router.delete("/superadmin/delete-role/:id", authMiddleware, deleteRole);
router.post("/superadmin/verify-invite-email", verifyInviteEmail);
router.post("/superadmin/resend-invite-otp/:id", authMiddleware, resendInviteOtp);
router.post("/superadmin/resend-invite-otp", authMiddleware, resendInviteOtp);
router.post("/superadmin/set-invite-password", setInvitePassword);

router.put(
    "/superadmin/update-profile",
    authMiddleware,
    upload.single("profilePitcher"),
    updateProfile
);
router.put("/superadmin/update-password", authMiddleware, updatePassword);

router.post(
    "/superadmin/upload-profilepitcher",
    authMiddleware,
    upload.single("profilePitcher"),
    uploadProfilePitcher
);

router.delete(
    "/superadmin/remove-profilepitcher",
    authMiddleware,
    removeProfilePitcher
);

export default router;
