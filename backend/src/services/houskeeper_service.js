const houskeeperModel = require("../models/houskeeper_model");

async function getHousekeeperData() {
  return houskeeperModel.getHousekeeperData();
}

async function updateCleaningStatus(roomNo, cleaningStatus) {
  return houskeeperModel.updateCleaningStatus(
    roomNo,
    cleaningStatus
  );
}

module.exports = {
  getHousekeeperData,
  updateCleaningStatus,
};