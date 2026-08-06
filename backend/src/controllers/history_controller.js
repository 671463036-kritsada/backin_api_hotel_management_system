const historyService = require("../services/history_service");

exports.getHistory = async (req, res) => {
  try {
    //  ดึง userId จาก token
    const userId = req.user.id;
    const result = await historyService.getHistory(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getHistory failed",
      error: error.message,
    });
  }
};

exports.getHistoryByBookingId = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await historyService.getHistoryByBookingId(
      req.params.bookingId,
      userId,
    );
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getHistoryByBookingId failed",
      error: error.message,
    });
  }
};

exports.submitReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const customerName = req.user.name;

    const { rating, comment } = req.body;

    const result = await historyService.submitReview(
      req.params.bookingId,
      userId,
      customerName,
      {
        rating,
        comment,
      },
    );

    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "submitReview failed",
      error: error.message,
    });
  }
};
