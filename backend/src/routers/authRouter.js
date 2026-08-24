import express from "express";
import login from "../controllers/auth/login.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";
import uploadProfilePitcher from "../controllers/auth/uploadProfilePitcher.js";
import forgotPassword from "../controllers/auth/forgotPassword.js";
import resetPassword from "../controllers/auth/resetPassword.js";
import getSidebarButtons from "../controllers/auth/getSidebarButtons.js";
import createRole from "../controllers/role/createRole.js";
import verifyInviteEmail from "../controllers/role/verifyInviteEmail.js";
import setInvitePassword from "../controllers/role/setInvitePassword.js";
import updateProfile from "../controllers/auth/updateProfile.js";
import updatePassword from "../controllers/auth/updatePassword.js";
import removeProfilePitcher from "../controllers/auth/removeProfilePitcher.js";

const router = express.Router();

router.post("/superadmin/login", login);

router.post("/superadmin/forgot-password", forgotPassword);
router.post("/superadmin/reset-password", resetPassword);

router.get("/superadmin/sidebar-buttons", authMiddleware, getSidebarButtons);
router.post("/superadmin/create-role", authMiddleware, createRole);
router.post("/superadmin/verify-invite-email", verifyInviteEmail);
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
