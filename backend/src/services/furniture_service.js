const furnitureModel = require("../models/furniture_model");
const bookingModel = require("../models/booking_model"); // ✅ เพิ่มบรรทัดนี้

function buildResponse(data, message = "success", statusCode = 200) {
  return { message, statusCode, data };
}

async function getFurniture(roomId, bookingId) {
  const data = await furnitureModel.getFurnitureByRoomAndBooking(roomId, bookingId);
  return buildResponse(data);
}

async function submitReport(reportItems, inspectorId) {
  const results = [];
  for (const item of reportItems) {
    const inspection = item.inspections?.[0];
    const result = await furnitureModel.createFurnitureInspection({
      furnitureId: item.isCustom ? null : item.id,
      roomId: item.roomId,
      bookingId: item.bookingId,
      title: item.title,
      image: item.image,
      inspectorId,
      status: inspection?.status,
      note: inspection?.note,
      damageImage: inspection?.damageImage,
    });
    results.push(result);
  }

  const bookingId = reportItems[0]?.bookingId;
  if (bookingId) {
    await bookingModel.updateInspectionStatus(bookingId, "COMPLETED");
  }

  return buildResponse(results, "furniture inspection submitted", 201);
}

module.exports = {
  getFurniture,
  submitReport,
};