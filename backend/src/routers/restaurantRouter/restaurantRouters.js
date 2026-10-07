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

const router = express.Router();

router.get("/sidebar-buttons", restaurantAuthMiddleware, getSidebarButtons);

router.get("/owner/profile", ownerAuthMiddleware, getOwnerProfile);
router.put("/owner/update-profile", ownerAuthMiddleware, updateOwnerProfile);
router.put("/owner/update-password", ownerAuthMiddleware, updateOwnerPassword);
router.post("/owner/logout", ownerAuthMiddleware, ownerLogout);
router.get("/owner/branches", ownerAuthMiddleware, getOwnerBranches);

// Public branches — user site (no auth), filter by frontend domain
router.get("/branches/public", getPublicBranches);

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

export default router;
