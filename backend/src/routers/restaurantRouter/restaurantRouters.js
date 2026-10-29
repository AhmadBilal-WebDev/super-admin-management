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
import {
    setBranchServiceArea,
    clearBranchServiceArea,
} from "../../controllers/restaurantController/owner/manageBranchAreas.js";
import {
    getTheme,
    updateTheme,
} from "../../controllers/restaurantController/owner/themeController.js";
import createStaffRole from "../../controllers/restaurantController/staff/createStaffRole.js";
import getStaffRoles from "../../controllers/restaurantController/staff/getStaffRoles.js";
import updateStaffRole from "../../controllers/restaurantController/staff/updateStaffRole.js";
import blockStaffRole from "../../controllers/restaurantController/staff/blockStaffRole.js";
import activateStaffRole from "../../controllers/restaurantController/staff/activateStaffRole.js";
import deleteStaffRole from "../../controllers/restaurantController/staff/deleteStaffRole.js";
import uploadCatalogImage from "../../controllers/restaurantController/catalog/uploadCatalogImage.js";
import createCategory from "../../controllers/restaurantController/catalog/createCategory.js";
import getCategories from "../../controllers/restaurantController/catalog/getCategories.js";
import updateCategory from "../../controllers/restaurantController/catalog/updateCategory.js";
import deleteCategory from "../../controllers/restaurantController/catalog/deleteCategory.js";
import createProduct from "../../controllers/restaurantController/catalog/createProduct.js";
import getProducts from "../../controllers/restaurantController/catalog/getProducts.js";
import updateProduct from "../../controllers/restaurantController/catalog/updateProduct.js";
import deleteProduct from "../../controllers/restaurantController/catalog/deleteProduct.js";
import createBanner from "../../controllers/restaurantController/banner/createBanner.js";
import getBanners from "../../controllers/restaurantController/banner/getBanners.js";
import getPublicBanners from "../../controllers/restaurantController/banner/getPublicBanners.js";
import updateBanner from "../../controllers/restaurantController/banner/updateBanner.js";
import deleteBanner from "../../controllers/restaurantController/banner/deleteBanner.js";
import getPublicBranches from "../../controllers/restaurantController/user/getBranches/getPublicBranches.js";
import checkBranchServiceArea from "../../controllers/restaurantController/user/getBranches/checkBranchServiceArea.js";
import addNewDeals from "../../controllers/restaurantController/deals/addNewDeals.js";
import getDeals from "../../controllers/restaurantController/deals/getDeals.js";
import getPublicDeals from "../../controllers/restaurantController/deals/getPublicDeals.js";
import updateDeal from "../../controllers/restaurantController/deals/updateDeal.js";
import deleteDeal from "../../controllers/restaurantController/deals/deleteDeal.js";

const router = express.Router();

router.get("/sidebar-buttons", restaurantAuthMiddleware, getSidebarButtons);

// Profile / branches / logout — owner + staff
router.get("/owner/profile", restaurantAuthMiddleware, getOwnerProfile);
router.get("/profile", restaurantAuthMiddleware, getOwnerProfile);
router.put("/owner/update-profile", ownerAuthMiddleware, updateOwnerProfile);
router.put("/owner/update-password", ownerAuthMiddleware, updateOwnerPassword);
router.post("/owner/logout", restaurantAuthMiddleware, ownerLogout);
router.post("/logout", restaurantAuthMiddleware, ownerLogout);
router.get("/owner/branches", restaurantAuthMiddleware, getOwnerBranches);
router.get("/branches", restaurantAuthMiddleware, getOwnerBranches);

// Branch service radius — owner marks km around restaurant pin (no lat/lng in body)
router.put(
    "/owner/branches/:branchId/areas",
    ownerAuthMiddleware,
    setBranchServiceArea
);
router.put(
    "/branches/:branchId/areas",
    ownerAuthMiddleware,
    setBranchServiceArea
);
router.delete(
    "/owner/branches/:branchId/areas",
    ownerAuthMiddleware,
    clearBranchServiceArea
);
router.delete(
    "/branches/:branchId/areas",
    ownerAuthMiddleware,
    clearBranchServiceArea
);

// Theme — per account (owner/staff), default light
router.get("/theme", restaurantAuthMiddleware, getTheme);
router.put("/theme", restaurantAuthMiddleware, updateTheme);

// Public branches — user site (no auth), filter by frontend domain
router.get("/branches/public", getPublicBranches);
// Check if customer lat/lng is inside branch polygon (outside = no order)
router.post(
    "/branches/:branchId/check-service-area",
    checkBranchServiceArea
);
router.get(
    "/branches/:branchId/check-service-area",
    checkBranchServiceArea
);

router.post(
    "/owner/upload-profilepitcher",
    restaurantAuthMiddleware,
    upload.single("profilePitcher"),
    uploadOwnerProfilePitcher
);

router.delete(
    "/owner/remove-profilepitcher",
    restaurantAuthMiddleware,
    removeOwnerProfilePitcher
);

// Staff roles — owner OR staff with create-staff / all-staff permission
router.get("/staff/roles", restaurantAuthMiddleware, getStaffRoles);
router.post("/staff/create-role", restaurantAuthMiddleware, createStaffRole);
router.put("/staff/update-role/:id", restaurantAuthMiddleware, updateStaffRole);
router.put("/staff/block-role/:id", restaurantAuthMiddleware, blockStaffRole);
router.put(
    "/staff/activate-role/:id",
    restaurantAuthMiddleware,
    activateStaffRole
);
router.delete(
    "/staff/delete-role/:id",
    restaurantAuthMiddleware,
    deleteStaffRole
);

// Image only — form-data
router.post(
    "/catalog/upload-image",
    restaurantAuthMiddleware,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "img", maxCount: 1 },
    ]),
    uploadCatalogImage
);

// Category — raw JSON
router.get("/catalog/categories", restaurantAuthMiddleware, getCategories);
router.post("/catalog/categories", restaurantAuthMiddleware, createCategory);
router.put("/catalog/categories/:id", restaurantAuthMiddleware, updateCategory);
router.delete(
    "/catalog/categories/:id",
    restaurantAuthMiddleware,
    deleteCategory
);

// Product — raw JSON (images via upload-image with type=product)
router.get("/catalog/products", restaurantAuthMiddleware, getProducts);
router.post("/catalog/products", restaurantAuthMiddleware, createProduct);
router.put("/catalog/products/:id", restaurantAuthMiddleware, updateProduct);
router.delete("/catalog/products/:id", restaurantAuthMiddleware, deleteProduct);

// Banner — public (user site, no auth)
router.get("/banner/public", getPublicBanners);

// Banner — owner dashboard (auth)
router.get("/banner", restaurantAuthMiddleware, getBanners);
router.post("/banner", restaurantAuthMiddleware, createBanner);
router.put("/banner/:id", restaurantAuthMiddleware, updateBanner);
router.delete("/banner/:id", restaurantAuthMiddleware, deleteBanner);

// Deals — public (user site, no auth)
router.get("/deals/public", getPublicDeals);

// Deals — owner dashboard (auth)
router.get("/deals", restaurantAuthMiddleware, getDeals);
router.post("/deals", restaurantAuthMiddleware, addNewDeals);
router.put("/deals/:id", restaurantAuthMiddleware, updateDeal);
router.delete("/deals/:id", restaurantAuthMiddleware, deleteDeal);

export default router;
