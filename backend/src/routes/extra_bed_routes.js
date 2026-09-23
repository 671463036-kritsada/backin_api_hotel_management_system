const express = require("express");
const extraBedController = require("../controllers/extra_bed_controller");
const { authMiddleware } = require("../middleware/auth_middleware");
const { isAdmin } = require("../middleware/role_middleware");

const router = express.Router();

router.use(authMiddleware, isAdmin);
router.get("/", extraBedController.getExtraBedTypes);
router.post("/", extraBedController.createExtraBedType);
router.put("/:id", extraBedController.updateExtraBedType);
router.delete("/:id", extraBedController.deleteExtraBedType);

module.exports = router;
