const furnitureModel = require("../models/furniture_model");

async function getFurniture() {
  return furnitureModel.getFurniture();
}

async function getFurnitureById(id) {
  return furnitureModel.getFurnitureById(id);
}

async function createFurniture(data) {
  return furnitureModel.createFurniture(data);
}

async function updateFurniture(id, data) {
  return furnitureModel.updateFurniture(id, data);
}

async function deleteFurniture(id) {
  return furnitureModel.deleteFurniture(id);
}

module.exports = {
  getFurniture,
  getFurnitureById,
  createFurniture,
  updateFurniture,
  deleteFurniture,
};
