// promotion_routes.js
const express = require("express");
const promotionController = require("../controllers/promotion_controller");
const { authMiddleware } = require("../middleware/auth_middleware");
const { isAdmin } = require("../middleware/role_middleware");

const uploadPromotionImage = require("../middleware/upload_room_image");

const router = express.Router();

// ต้องอยู่ก่อน "/:id" เสมอ ไม่งั้น Express จะจับ "my-coupons" เป็นค่า :id แทน
router.get("/my-coupons", authMiddleware, promotionController.getMyCoupons);

// Admin: ดูโปรโมชั่นทั้งหมด (รวมปิด/หมดอายุ) — ต้องอยู่ก่อน "/:id"
router.get("/admin/all", authMiddleware, isAdmin, promotionController.getAllPromotionsAdmin);


// Public: ดูรายการโปรโมชั่นทั้งหมด/รายละเอียด (ไม่ต้อง login ก็ดูได้)
router.get("/", promotionController.getActivePromotions);
router.get("/:id", promotionController.getPromotionById);

// User: กดรับคูปอง
router.post("/:id/claim", authMiddleware, promotionController.claimPromotion);

// Admin: แจกคูปองให้ user เฉพาะราย
router.post(
  "/:id/grant",
  authMiddleware,
  isAdmin,
  promotionController.grantPromotion,
);


// Admin: CRUD
router.post(
  "/",
  authMiddleware,
  isAdmin,
  uploadPromotionImage.single("image"),
  promotionController.createPromotion,
);
router.put(
  "/:id",
  authMiddleware,
  isAdmin,
  uploadPromotionImage.single("image"),
  promotionController.updatePromotion,
);
router.delete("/:id", authMiddleware, isAdmin, promotionController.deletePromotion);


module.exports = router;