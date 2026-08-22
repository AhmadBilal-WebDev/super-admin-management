import express from "express";
import login from "../controllers/auth/login.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";
import uploadProfilePitcher from "../controllers/auth/uploadProfilePitcher.js";
import forgotPassword from "../controllers/auth/forgotPassword.js";
import resetPassword from "../controllers/auth/resetPassword.js";

const router = express.Router();

router.post("/login/superadmin", login);

router.post("/superadmin/forgot-password", forgotPassword);
router.post("/superadmin/reset-password", resetPassword);

router.post(
    "/superadmin/upload-profilepitcher",
    authMiddleware,
    upload.single("profilePitcher"),
    uploadProfilePitcher
);

export default router;
