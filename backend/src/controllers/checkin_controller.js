const checkinService = require("../services/checkin_service");

exports.updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await roomService.updateRoomStatus(req.params.id, status);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "updateRoomStatus failed",
      error: error.message,
    });
  }
};

exports.createCheckIn = async (req, res) => {
  try {
    console.log(
      "createCheckIn headers:",
      req.headers && req.headers["content-type"],
    );
    console.log("createCheckIn body:", req.body);
    console.log("createCheckIn files:", req.files); // debug ดูว่า multer ส่งไฟล์มาถูกไหม

    // ดึง path ของไฟล์ที่ multer บันทึกไว้แล้ว
    const idCardImagePath = req.files?.idCardImage?.[0]
      ? `uploads/checkins/${req.files.idCardImage[0].filename}`
      : null;
    const paymentSlipImagePath = req.files?.paymentSlipImage?.[0]
      ? `uploads/checkins/${req.files.paymentSlipImage[0].filename}`
      : null;

    const data = {
      ...req.body,
      idCardImage: idCardImagePath,
      paymentSlipImage: paymentSlipImagePath,
    };

    const result = await checkinService.createCheckIn(data);
    res.status(result.statusCode || 201).json(result);
  } catch (error) {
    res.status(500).json({
      message: "createCheckIn failed",
      error: error.message,
    });
  }
};

exports.getCheckIns = async (req, res) => {
  try {
    const result = await checkinService.getCheckIns();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getCheckIns failed",
      error: error.message,
    });
  }
};

exports.getCheckInById = async (req, res) => {
  try {
    const result = await checkinService.getCheckInById(req.params.id);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getCheckInById failed",
      error: error.message,
    });
  }
};