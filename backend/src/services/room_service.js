const roomModel = require("../models/room_model");

async function getRooms() {
  return roomModel.getRooms();
}

async function getRoomById(id) {
  return roomModel.getRoomById(id);
}

async function createRoom(data) {
  return roomModel.createRoom(data);
}

async function updateRoom(id, data) {
  return roomModel.updateRoom(id, data);
}

async function deleteRoom(id) {
  return roomModel.deleteRoom(id);
}

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
