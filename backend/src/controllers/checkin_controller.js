const checkinService = require("../services/checkin_service");

exports.createCheckIn = async (req, res) => {
  try {
    console.log(
      "createCheckIn headers:",
      req.headers && req.headers["content-type"],
    );
    console.log("createCheckIn body:", req.body);
    const result = await checkinService.createCheckIn(req.body);
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
