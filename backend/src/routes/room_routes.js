const express = require("express");
const roomController = require("../controllers/room_controller");
const { authMiddleware } = require("../middleware/auth_middleware");
const { isAdmin } = require("../middleware/role_middleware");
const uploadRoomImage = require("../middleware/upload_room_image"); // เพิ่ม

const router = express.Router();

router.get("/", roomController.getRooms);
router.get("/available", roomController.getAvailableRooms);
router.get("/:id", roomController.getRoomById);

router.post(
  "/",
  authMiddleware,
  isAdmin,
  uploadRoomImage.single("image"), // เพิ่ม: field name ต้องชื่อ "image"
  roomController.createRoom,
);
router.put(
  "/:id",
  authMiddleware,
  isAdmin,
  uploadRoomImage.single("image"), // เพิ่ม
  roomController.updateRoom,
);
router.delete("/:id", authMiddleware, isAdmin, roomController.deleteRoom);

module.exports = router;