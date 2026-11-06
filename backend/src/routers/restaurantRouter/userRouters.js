import express from "express";
import userAuthMiddleware from "../../middlewares/tenantMiddleware/userAuthMiddleware.js";
import upload from "../../middlewares/tenantMiddleware/multer.js";
import requestLoginOtp from "../../controllers/restaurantController/user/userAuth/requestLoginOtp.js";
import requestSigninOtp from "../../controllers/restaurantController/user/userAuth/requestSigninOtp.js";
import verifyLoginOtp from "../../controllers/restaurantController/user/userAuth/verifyLoginOtp.js";
import resendLoginOtp from "../../controllers/restaurantController/user/userAuth/resendLoginOtp.js";
import getUserProfile from "../../controllers/restaurantController/user/userAuth/getUserProfile.js";
import updateUserProfile from "../../controllers/restaurantController/user/userAuth/updateUserProfile.js";
import uploadUserProfilePitcher from "../../controllers/restaurantController/user/userAuth/uploadUserProfilePitcher.js";
import removeUserProfilePitcher from "../../controllers/restaurantController/user/userAuth/removeUserProfilePitcher.js";
import deleteUserProfile from "../../controllers/restaurantController/user/userAuth/deleteUserProfile.js";
import userLogout from "../../controllers/restaurantController/user/userAuth/userLogout.js";

const router = express.Router();

// SIGNUP — full details (name, email, contact, branch)
router.post("/auth/signup", requestLoginOtp);
router.post("/auth/request-otp", requestLoginOtp); // alias

// SIGNIN — email only (must already exist)
router.post("/auth/signin", requestSigninOtp);

// OTP verify / resend (both signup + signin)
router.post("/auth/verify-otp", verifyLoginOtp);
router.post("/auth/resend-otp", resendLoginOtp);

// Profile — auth required
router.get("/auth/profile", userAuthMiddleware, getUserProfile);
router.put("/auth/profile", userAuthMiddleware, updateUserProfile);
router.post(
    "/auth/upload-profilepitcher",
    userAuthMiddleware,
    upload.single("profilePitcher"),
    uploadUserProfilePitcher
);
router.delete(
    "/auth/remove-profilepitcher",
    userAuthMiddleware,
    removeUserProfilePitcher
);
router.delete(
    "/auth/profile",
    userAuthMiddleware,
    deleteUserProfile
);
router.post("/auth/logout", userAuthMiddleware, userLogout);

export default router;
