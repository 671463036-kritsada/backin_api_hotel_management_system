const furnitureService = require("../services/furniture_service");

exports.getFurniture = async (req, res) => {
  try {
    const { roomId, bookingId } = req.query;
    if (!roomId || !bookingId) {
      return res.status(400).json({
        message: "roomId และ bookingId จำเป็นต้องระบุ",
        statusCode: 400,
        data: null,
      });
    }
    const result = await furnitureService.getFurniture(roomId, bookingId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getFurniture failed",
      error: error.message,
    });
  }
};

exports.submitReport = async (req, res) => {
  try {
    const inspectorId = req.user?.id; // ดึงจาก token เหมือน endpoint อื่น
    const result = await furnitureService.submitReport(req.body, inspectorId);
    res.status(result.statusCode || 201).json(result);
  } catch (error) {
    res.status(500).json({
      message: "submitReport failed",
      error: error.message,
    });
  }
};