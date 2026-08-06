const houskeeperService = require("../services/houskeeper_service");

exports.getHousekeeper = async (req, res) => {
  try {
    const result = await houskeeperService.getHousekeeperData();
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "getHousekeeper failed", error: error.message });
  }
};
