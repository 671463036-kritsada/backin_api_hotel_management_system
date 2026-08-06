const houskeeperModel = require("../models/houskeeper_model");

async function getHousekeeperData() {
  return houskeeperModel.getHousekeeperData();
}

module.exports = {
  getHousekeeperData,
};
