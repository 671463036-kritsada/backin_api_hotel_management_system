const express = require("express");
const { authMiddleware } = require("../middleware/auth_middleware");
const { isAdmin } = require("../middleware/role_middleware");
const uploadImage = require("../middleware/upload_room_image");
const announcementController = require("../controllers/announcement_controller");

const router = express.Router();

router.get("/", announcementController.getActiveAnnouncements);
router.get(
  "/admin/all",
  authMiddleware,
  isAdmin,
  announcementController.getAllAnnouncements,
);
router.post(
  "/",
  authMiddleware,
  isAdmin,
  uploadImage.single("image"),
  announcementController.createAnnouncement,
);
router.put(
  "/:id",
  authMiddleware,
  isAdmin,
  uploadImage.single("image"),
  announcementController.updateAnnouncement,
);
router.delete(
  "/:id",
  authMiddleware,
  isAdmin,
  announcementController.deleteAnnouncement,
);

module.exports = router;
