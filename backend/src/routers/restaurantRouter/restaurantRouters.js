import express from "express";
import ownerAuthMiddleware from "../../middlewares/tenantMiddleware/ownerAuthMiddleware.js";
import restaurantAuthMiddleware from "../../middlewares/tenantMiddleware/restaurantAuthMiddleware.js";
import upload from "../../middlewares/tenantMiddleware/multer.js";
import getSidebarButtons from "../../controllers/restaurantController/owner/getSidebarButtons.js";
import getOwnerProfile from "../../controllers/restaurantController/owner/getOwnerProfile.js";
import updateOwnerProfile from "../../controllers/restaurantController/owner/updateOwnerProfile.js";
import updateOwnerPassword from "../../controllers/restaurantController/owner/updateOwnerPassword.js";
import uploadOwnerProfilePitcher from "../../controllers/restaurantController/owner/uploadOwnerProfilePitcher.js";
import removeOwnerProfilePitcher from "../../controllers/restaurantController/owner/removeOwnerProfilePitcher.js";
import ownerLogout from "../../controllers/restaurantController/owner/ownerLogout.js";
import getOwnerBranches from "../../controllers/restaurantController/owner/getOwnerBranches.js";
import createStaffRole from "../../controllers/restaurantController/staff/createStaffRole.js";
import getStaffRoles from "../../controllers/restaurantController/staff/getStaffRoles.js";
import updateStaffRole from "../../controllers/restaurantController/staff/updateStaffRole.js";
import blockStaffRole from "../../controllers/restaurantController/staff/blockStaffRole.js";
import activateStaffRole from "../../controllers/restaurantController/staff/activateStaffRole.js";
import deleteStaffRole from "../../controllers/restaurantController/staff/deleteStaffRole.js";

const router = express.Router();

router.get("/sidebar-buttons", restaurantAuthMiddleware, getSidebarButtons);

router.get("/owner/profile", ownerAuthMiddleware, getOwnerProfile);
router.put("/owner/update-profile", ownerAuthMiddleware, updateOwnerProfile);
router.put("/owner/update-password", ownerAuthMiddleware, updateOwnerPassword);
router.post("/owner/logout", ownerAuthMiddleware, ownerLogout);
router.get("/owner/branches", ownerAuthMiddleware, getOwnerBranches);

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

router.get("/staff/roles", ownerAuthMiddleware, getStaffRoles);
router.post("/staff/create-role", ownerAuthMiddleware, createStaffRole);
router.put("/staff/update-role/:id", ownerAuthMiddleware, updateStaffRole);
router.put("/staff/block-role/:id", ownerAuthMiddleware, blockStaffRole);
router.put("/staff/activate-role/:id", ownerAuthMiddleware, activateStaffRole);
router.delete("/staff/delete-role/:id", ownerAuthMiddleware, deleteStaffRole);

export default router;
