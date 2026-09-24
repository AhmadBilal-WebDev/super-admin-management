import express from "express";
import ownerAuthMiddleware from "../../middlewares/tenantMiddleware/ownerAuthMiddleware.js";
import upload from "../../middlewares/tenantMiddleware/multer.js";
import getSidebarButtons from "../../controllers/restaurantController/getSidebarButtons.js";
import getOwnerProfile from "../../controllers/restaurantController/getOwnerProfile.js";
import updateOwnerProfile from "../../controllers/restaurantController/updateOwnerProfile.js";
import updateOwnerPassword from "../../controllers/restaurantController/updateOwnerPassword.js";
import uploadOwnerProfilePitcher from "../../controllers/restaurantController/uploadOwnerProfilePitcher.js";
import removeOwnerProfilePitcher from "../../controllers/restaurantController/removeOwnerProfilePitcher.js";
import ownerLogout from "../../controllers/restaurantController/ownerLogout.js";

const router = express.Router();

router.get("/sidebar-buttons", ownerAuthMiddleware, getSidebarButtons);
router.get("/owner/profile", ownerAuthMiddleware, getOwnerProfile);
router.put("/owner/update-profile", ownerAuthMiddleware, updateOwnerProfile);
router.put("/owner/update-password", ownerAuthMiddleware, updateOwnerPassword);
router.post("/owner/logout", ownerAuthMiddleware, ownerLogout);

router.post(
    "/owner/upload-profilepitcher",
    ownerAuthMiddleware,
    upload.single("profilePitcher"),
    uploadOwnerProfilePitcher
);

router.delete(
    "/owner/remove-profilepitcher",
    ownerAuthMiddleware,
    removeOwnerProfilePitcher
);

export default router;
