const furnitureModel = require("../models/furniture_model");

module.exports = {
  getFurniture: (roomId) => furnitureModel.getAllFurniture(roomId),
  createFurniture: (data) => furnitureModel.createFurniture(data),
  updateFurniture: (id, data) => furnitureModel.updateFurniture(id, data),
  deleteFurniture: (id) => furnitureModel.deleteFurniture(id),
};
