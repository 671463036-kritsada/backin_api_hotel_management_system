const houskeeperService = require("../services/houskeeper_service");

exports.getHousekeeper = async (req, res) => {
  try {
    const result = await houskeeperService.getHousekeeperData();

    return res
      .status(result.statusCode || 200)
      .json(result);
  } catch (error) {
    console.error("getHousekeeper failed:", error);

    return res.status(500).json({
      message: "getHousekeeper failed",
      statusCode: 500,
      data: null,
      error: error.message,
    });
  }
};

exports.updateCleaningStatus = async (req, res) => {
  try {
    const { roomNo } = req.params;
    const { cleaningStatus } = req.body;

    const result = await houskeeperService.updateCleaningStatus(
      roomNo,
      cleaningStatus
    );

    return res
      .status(result.statusCode || 200)
      .json(result);
  } catch (error) {
    console.error("updateCleaningStatus failed:", error);

    return res.status(500).json({
      message: "updateCleaningStatus failed",
      statusCode: 500,
      data: null,
      error: error.message,
    });
  }
};