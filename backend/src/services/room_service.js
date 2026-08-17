const roomModel = require("../models/room_model");

function buildResponse(data, message = "success", statusCode = 200) {
  return { message, statusCode, data };
}
async function getAvailableRooms({ checkIn, checkOut, roomType }) {
  if (!checkIn || !checkOut) {
    return roomModel.buildResponse(
      null,
      "กรุณาระบุวันที่เช็คอินและเช็คเอาท์",
      400,
    );
  }
  if (new Date(checkIn) >= new Date(checkOut)) {
    return roomModel.buildResponse(
      null,
      "วันที่เช็คเอาท์ต้องอยู่หลังวันที่เช็คอิน",
      400,
    );
  }

  const rooms = await roomModel.getAvailableRooms({
    checkIn,
    checkOut,
    roomType,
  });
  return rooms; //  ไม่ต้องห่อซ้ำ เพราะ roomModel.getAvailableRooms คืน buildResponse(...) มาให้แล้ว
}

async function getRooms() {
  return roomModel.getRooms();
}

async function getRoomById(id) {
  return roomModel.getRoomById(id);
}

async function createRoom(data) {
  return roomModel.createRoom(data);
}

const ROOM_STATUS = {
  AVAILABLE: "ว่าง",
  BOOKED: "จองแล้ว",
  OCCUPIED: "เข้าพักแล้ว",
  MAINTENANCE: "ปิดปรับปรุง",
};

async function updateRoomStatus(id, status) {
  if (!id) {
    return roomModel.buildResponse(null, "กรุณาระบุรหัสห้อง", 400);
  }
  if (!status) {
    return roomModel.buildResponse(null, "กรุณาระบุสถานะห้อง", 400);
  }

  const validStatuses = Object.values(ROOM_STATUS);
  if (!validStatuses.includes(status)) {
    return roomModel.buildResponse(
      null,
      `สถานะไม่ถูกต้อง ต้องเป็นหนึ่งใน: ${validStatuses.join(", ")}`,
      400,
    );
  }

  return roomModel.updateRoomStatus(id, status);
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
  getAvailableRooms,
  updateRoomStatus,
};
