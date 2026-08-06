const historyModel = require("../models/history_model");

function buildResponse(data, message = "success", statusCode = 200) {
  return {
    message,
    statusCode,
    data,
  };
}

async function getHistory(userId) {
  const data = await historyModel.getHistoryByUserId(userId);
  return buildResponse(data);
}

async function getHistoryByBookingId(bookingId, userId) {
  const data = await historyModel.getHistoryByBookingId(bookingId, userId);
  if (!data) {
    return buildResponse(null, "history not found", 404);
  }
  return buildResponse(data);
}

async function submitReview(
  bookingId,
  userId,
  customerName,
  { rating, comment },
) {
  const existing = await historyModel.getHistoryByBookingId(bookingId, userId);

  if (!existing) {
    return buildResponse(null, "booking not found or not checked out", 404);
  }

  if (existing.review) {
    return buildResponse(null, "review already submitted", 409);
  }

  await historyModel.createReview(bookingId, userId, customerName, {
    rating,
    comment,
  });

  const updated = await historyModel.getHistoryByBookingId(bookingId, userId);

  return buildResponse(updated, "review submitted", 201);
}


module.exports = {
  getHistory,
  getHistoryByBookingId,
  submitReview,
};
