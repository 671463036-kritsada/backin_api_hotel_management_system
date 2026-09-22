const express = require("express");
const cartController = require("../controllers/cart_controller");
const { authMiddleware } = require("../middleware/auth_middleware");

const router = express.Router();

router.get("/", authMiddleware, cartController.getCart);
router.post("/", authMiddleware, cartController.addItem);
router.delete("/:id", authMiddleware, cartController.removeItem);
router.delete("/", authMiddleware, cartController.clear);

module.exports = router;
