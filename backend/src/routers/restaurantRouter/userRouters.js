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
import getPublicCategories from "../../controllers/restaurantController/catalog/getPublicCategories.js";
import getPublicProducts from "../../controllers/restaurantController/catalog/getPublicProducts.js";
import placeOrder from "../../controllers/restaurantController/user/orders/placeOrder.js";
import getMyOrders from "../../controllers/restaurantController/user/orders/getMyOrders.js";
import getOrderById from "../../controllers/restaurantController/user/orders/getOrderById.js";
import getCart from "../../controllers/restaurantController/user/cart/getCart.js";
import syncCart from "../../controllers/restaurantController/user/cart/syncCart.js";
import upsertCartItem from "../../controllers/restaurantController/user/cart/upsertCartItem.js";
import updateCartItem from "../../controllers/restaurantController/user/cart/updateCartItem.js";
import removeCartItem from "../../controllers/restaurantController/user/cart/removeCartItem.js";
import clearCart from "../../controllers/restaurantController/user/cart/clearCart.js";
import checkout from "../../controllers/restaurantController/user/cart/checkout.js";

const router = express.Router();

// Public catalog — no auth; branchName required (that branch + all-branches items)
router.get("/catalog/categories", getPublicCategories);
router.post("/catalog/categories", getPublicCategories);
router.get("/catalog/products", getPublicProducts);
router.post("/catalog/products", getPublicProducts);

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

// Cart / Checkout — login required (guest uses localStorage on frontend)
router.get("/cart", userAuthMiddleware, getCart);
router.post("/cart/sync", userAuthMiddleware, syncCart);
router.post("/cart/items", userAuthMiddleware, upsertCartItem);
router.put("/cart/items/:itemId", userAuthMiddleware, updateCartItem);
router.delete("/cart/items/:itemId", userAuthMiddleware, removeCartItem);
router.delete("/cart", userAuthMiddleware, clearCart);
router.post("/checkout", userAuthMiddleware, checkout);

// Orders — customer auth required
router.post("/orders", userAuthMiddleware, placeOrder);
router.get("/orders", userAuthMiddleware, getMyOrders);
router.get("/orders/:orderId", userAuthMiddleware, getOrderById);

export default router;
