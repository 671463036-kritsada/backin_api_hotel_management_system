const checkinService = require("../services/checkin_service");

exports.createCheckIn = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(
      "createCheckIn headers:",
      req.headers && req.headers["content-type"],
    );
    console.log("createCheckIn body:", req.body);
    console.log("createCheckIn files:", req.files);

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

    const result = await checkinService.createCheckIn(data, userId);
    res.status(result.statusCode || 201).json(result);
  } catch (error) {
    res.status(500).json({
      message: "createCheckIn failed",
      error: error.message,
    });
  }
};

exports.getPendingCheckins = async (req, res) => {
  try {
    const result = await checkinService.getPendingCheckins();
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({ message: "getPendingCheckins failed", error: error.message });
  }
};

exports.approveCheckin = async (req, res) => {
  try {
    const result = await checkinService.approveCheckin(req.params.id);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({ message: "approveCheckin failed", error: error.message });
  }
};

exports.rejectCheckin = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await checkinService.rejectCheckin(req.params.id, reason);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({ message: "rejectCheckin failed", error: error.message });
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