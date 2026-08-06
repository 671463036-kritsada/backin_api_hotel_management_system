const checkinModel = require("../models/checkin_model");

async function createCheckIn(data) {
  return checkinModel.createCheckIn(data);
}

async function getCheckIns() {
  return checkinModel.getCheckIns();
}

async function getCheckInById(id) {
  return checkinModel.getCheckInById(id);
}

async function updateCheckIn(id, updates) {
  return checkinModel.updateCheckIn(id, updates);
}

module.exports = {
  createCheckIn,
  getCheckIns,
  getCheckInById,
  updateCheckIn,
};
