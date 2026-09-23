const express = require("express");
const furnitureController = require("../controllers/furniture_admin_controller");
const { authMiddleware } = require("../middleware/auth_middleware");
const { isAdmin } = require("../middleware/role_middleware");
const uploadImage = require("../middleware/furniture_upload_middleware");

const router = express.Router();
router.use(authMiddleware, isAdmin);
router.get("/", furnitureController.getFurniture);
router.post(
  "/",
  uploadImage.single("image"),
  furnitureController.createFurniture,
);
router.put(
  "/:id",
  uploadImage.single("image"),
  furnitureController.updateFurniture,
);
router.delete("/:id", furnitureController.deleteFurniture);

module.exports = router;
