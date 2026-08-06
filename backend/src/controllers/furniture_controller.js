const furnitureService = require("../services/furniture_service");

exports.getFurniture = async (req, res) => {
  try {
    const result = await furnitureService.getFurniture();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getFurniture failed",
      error: error.message,
    });
  }
};

exports.getFurnitureById = async (req, res) => {
  try {
    const result = await furnitureService.getFurnitureById(req.params.id);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "getFurnitureById failed",
      error: error.message,
    });
  }
};

exports.createFurniture = async (req, res) => {
  try {
    const result = await furnitureService.createFurniture(req.body);
    res.status(result.statusCode || 201).json(result);
  } catch (error) {
    res.status(500).json({
      message: "createFurniture failed",
      error: error.message,
    });
  }
};

exports.updateFurniture = async (req, res) => {
  try {
    const result = await furnitureService.updateFurniture(
      req.params.id,
      req.body,
    );
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "updateFurniture failed",
      error: error.message,
    });
  }
};

exports.deleteFurniture = async (req, res) => {
  try {
    const result = await furnitureService.deleteFurniture(req.params.id);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "deleteFurniture failed",
      error: error.message,
    });
  }
};
