const express = require("express");
const houskeeperController = require("../controllers/houskeeper_controller");
const {
  authMiddleware,
  isHousekeeper,
} = require("../middleware/auth_middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  isHousekeeper,
  houskeeperController.getHousekeeper
);

router.put(
  "/rooms/:roomNo/cleaning-status",
  authMiddleware,
  isHousekeeper,
  houskeeperController.updateCleaningStatus
);

module.exports = router;