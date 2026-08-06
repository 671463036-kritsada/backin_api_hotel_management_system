function generateRoomId(roomType = "room", seq = 1) {
  const prefix = roomType === "house" ? "H" : "R";
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

function generateBookingId(year, seq) {
  return `BK-${year}${String(seq).padStart(4, "0")}`;
}

module.exports = {
  generateRoomId,
  generateBookingId,
};

// const { v4: uuidv4 } = require('uuid');

// function generateId(prefix = 'id') {
//   return `${prefix}_${uuidv4()}`;
// }

// function generateBookingId() {
//   return generateId('bk');
// }

// function generateRoomId() {
//   return generateId('rm');
// }

// module.exports = { generateId, generateBookingId, generateRoomId };
