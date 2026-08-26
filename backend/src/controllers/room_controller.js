// controllers/room_controller.js
const roomService = require('../services/room_service');

function send(res, result) {
  return res.status(result.statusCode || 200).json(result);
}

exports.getRooms = async (req, res) => {
  const result = await roomService.getRooms();
  send(res, result);
};

exports.getAvailableRooms = async (req, res) => {
  const { checkIn, checkOut, roomType } = req.query;
  if (!checkIn || !checkOut) {
    return res.status(400).json({ message: 'ต้องระบุ checkIn และ checkOut', statusCode: 400, data: null });
  }
  const result = await roomService.getAvailableRooms({ checkIn, checkOut, roomType });
  send(res, result);
};

exports.getRoomById = async (req, res) => {
  const result = await roomService.getRoomById(req.params.id);
  send(res, result);
};

// exports.createRoom = async (req, res) => {
//   const result = await roomService.createRoom(req.body);
//   send(res, result);
// };

// exports.updateRoom = async (req, res) => {
//   const result = await roomService.updateRoom(req.params.id, req.body);
//   send(res, result);
// };


exports.createRoom = async (req, res) => {
  const result = await roomService.createRoom(req.body, req.file); // เพิ่ม req.file
  send(res, result);
};

exports.updateRoom = async (req, res) => {
  const result = await roomService.updateRoom(req.params.id, req.body, req.file); // เพิ่ม req.file
  send(res, result);
};

exports.deleteRoom = async (req, res) => {
  const result = await roomService.deleteRoom(req.params.id);
  send(res, result);
};



// const roomService = require("../services/room_service");

// exports.getAvailableRooms = async (req, res) => {
//   try {
//     const { checkIn, checkOut, roomType } = req.query;
//     const result = await roomService.getAvailableRooms({
//       checkIn,
//       checkOut,
//       roomType,
//     });
//     res.status(result.statusCode || 200).json(result);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "getAvailableRooms failed", error: error.message });
//   }
// };

// exports.getRooms = async (req, res) => {
//   try {
//     const result = await roomService.getRooms();
//     res.status(200).json(result);
//   } catch (error) {
//     res.status(500).json({
//       message: "getRooms failed",
//       error: error.message,
//     });
//   }
// };

// exports.getRoomById = async (req, res) => {
//   try {
//     const result = await roomService.getRoomById(req.params.id);
//     res.status(result.statusCode || 200).json(result);
//   } catch (error) {
//     res.status(500).json({
//       message: "getRoomById failed",
//       error: error.message,
//     });
//   }
// };

// exports.createRoom = async (req, res) => {
//   try {
//     const result = await roomService.createRoom(req.body);
//     res.status(result.statusCode || 201).json(result);
//   } catch (error) {
//     res.status(500).json({
//       message: "createRoom failed",
//       error: error.message,
//     });
//   }
// };


// exports.updateRoom = async (req, res) => {
//   try {
//     const result = await roomService.updateRoom(req.params.id, req.body);
//     res.status(result.statusCode || 200).json(result);
//   } catch (error) {
//     res.status(500).json({
//       message: "updateRoom failed",
//       error: error.message,
//     });
//   }
// };

// exports.deleteRoom = async (req, res) => {
//   try {
//     const result = await roomService.deleteRoom(req.params.id);
//     res.status(result.statusCode || 200).json(result);
//   } catch (error) {
//     res.status(500).json({
//       message: "deleteRoom failed",
//       error: error.message,
//     });
//   }
// };
