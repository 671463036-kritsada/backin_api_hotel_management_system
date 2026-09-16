const express = require("express");

const furnitureController = require("../controllers/furniture_controller");

const { authMiddleware } = require("../middleware/auth_middleware");

const router = express.Router();

const uploadImage = require("../middleware/furniture_upload_middleware");

router.get(
  "/",
  authMiddleware,
  furnitureController.getFurniture,
);

router.post(
  "/report",
  authMiddleware,
  uploadImage.any(),
  furnitureController.submitReport
);

module.exports = router;

// const express = require("express");
// const furnitureController = require("../controllers/furniture_controller");
// const { authMiddleware } = require("../middleware/auth_middleware");
// const uploadImage = require("../middleware/upload_room_image");

// const router = express.Router();

// router.get("/", authMiddleware, furnitureController.getFurniture);
// router.post(
//   "/report",
//   authMiddleware,
//   uploadImage.any(), // รับไฟล์หลายชื่อ field (photo_0, photo_1, ...)
//   furnitureController.submitReport,
// );

// module.exports = router;




// const express = require("express");
// const furnitureController = require("../controllers/furniture_controller");
// const {authMiddleware} = require("../middleware/auth_middleware");

// const router = express.Router();

// // router.get("/", furnitureController.getFurniture);

// router.get("/", authMiddleware, furnitureController.getFurniture);
// router.post("/report", authMiddleware, furnitureController.submitReport);

// module.exports = router;