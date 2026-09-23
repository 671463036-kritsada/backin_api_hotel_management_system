const extraBedModel = require("../models/extra_bed_model");

module.exports = {
  getExtraBedTypes: (options) => extraBedModel.getExtraBedTypes(options),
  createExtraBedType: (data) => extraBedModel.createExtraBedType(data),
  updateExtraBedType: (id, data) => extraBedModel.updateExtraBedType(id, data),
  deleteExtraBedType: (id) => extraBedModel.deleteExtraBedType(id),
};
