// promotion_controller.js
const promotionService = require("../services/promotion_service");

exports.getActivePromotions = async (req, res) => {
  try {
    const result = await promotionService.getActivePromotions();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getActivePromotions failed",
      error: error.message,
    });
  }
};

exports.getPromotionById = async (req, res) => {
  try {
    const result = await promotionService.getPromotionById(req.params.id);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getPromotionById failed",
      error: error.message,
    });
  }
};

exports.claimPromotion = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await promotionService.claimPromotion(userId, req.params.id);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "claimPromotion failed",
      error: error.message,
    });
  }
};

exports.getMyCoupons = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status || "available";
    const result = await promotionService.getUserCoupons(userId, status);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getMyCoupons failed",
      error: error.message,
    });
  }
};

// Admin: แจกคูปองให้ user เฉพาะราย
exports.grantPromotion = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        message: "กรุณาระบุ userId",
      });
    }
    const result = await promotionService.grantPromotionToUser(
      userId,
      req.params.id,
    );
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "grantPromotion failed",
      error: error.message,
    });
  }
};

exports.getAllPromotionsAdmin = async (req, res) => {
  try {
    const result = await promotionService.getAllPromotionsAdmin();
    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "getAllPromotionsAdmin failed", error: error.message });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    const result = await promotionService.createPromotion(req.body, req.file);
    res.status(result.statusCode || 201).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "createPromotion failed", error: error.message });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const result = await promotionService.updatePromotion(
      req.params.id,
      req.body,
      req.file,
    );
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "updatePromotion failed", error: error.message });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const result = await promotionService.deletePromotion(req.params.id);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "deletePromotion failed", error: error.message });
  }
};
