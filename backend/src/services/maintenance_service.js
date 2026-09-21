const maintenanceModel = require("../models/maintenance_model");

exports.getAllReports = async () => {
  return await maintenanceModel.getAllReports();
};

exports.addReport = async (data) => {
  const newId = await maintenanceModel.addReport(data);
  return await maintenanceModel.findReportById(newId);
};

exports.updateStatus = async (id, status) => {
  await maintenanceModel.updateStatus(id, status);
  return await maintenanceModel.findReportById(id);
};