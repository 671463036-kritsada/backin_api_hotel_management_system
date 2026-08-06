const roomService = require("../services/room_service");

exports.getRooms = async (req, res) => {
  try {
    const result = await roomService.getRooms();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getRooms failed",
      error: error.message,
    });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const result = await roomService.getRoomById(req.params.id);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getRoomById failed",
      error: error.message,
    });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const result = await roomService.createRoom(req.body);
    res.status(result.statusCode || 201).json(result);
  } catch (error) {
    res.status(500).json({
      message: "createRoom failed",
      error: error.message,
    });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const result = await roomService.updateRoom(req.params.id, req.body);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "updateRoom failed",
      error: error.message,
    });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const result = await roomService.deleteRoom(req.params.id);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "deleteRoom failed",
      error: error.message,
    });
  }
};
