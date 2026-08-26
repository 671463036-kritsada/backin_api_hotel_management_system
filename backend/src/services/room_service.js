const roomModel = require("../models/room_model");

async function getAvailableRooms({ checkIn, checkOut, roomType }) {
  if (!checkIn || !checkOut) {
    return roomModel.buildResponse(null, "กรุณาระบุวันที่เช็คอินและเช็คเอาท์", 400);
  }
  if (new Date(checkIn) >= new Date(checkOut)) {
    return roomModel.buildResponse(null, "วันที่เช็คเอาท์ต้องอยู่หลังวันที่เช็คอิน", 400);
  }
  return roomModel.getAvailableRooms({ checkIn, checkOut, roomType });
}

async function getRooms() {
  return roomModel.getRooms();
}
async function getRoomById(id) {
  return roomModel.getRoomById(id);
}

async function createRoom(data, file) {
  return roomModel.createRoom(data, file);
}

async function updateRoom(id, data, file) {
  return roomModel.updateRoom(id, data, file);
}

// async function createRoom(data) {
//   return roomModel.createRoom(data);
// }
// async function updateRoom(id, data) {
//   return roomModel.updateRoom(id, data);
// }
async function deleteRoom(id) {
  return roomModel.deleteRoom(id);
}

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms,
};