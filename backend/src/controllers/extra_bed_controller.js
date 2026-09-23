const extraBedService = require("../services/extra_bed_service");

function send(res, result) {
  return res.status(result.statusCode || 200).json(result);
}

exports.getExtraBedTypes = async (req, res) => {
  try {
    send(
      res,
      await extraBedService.getExtraBedTypes({ includeInactive: true }),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createExtraBedType = async (req, res) => {
  try {
    send(res, await extraBedService.createExtraBedType(req.body));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateExtraBedType = async (req, res) => {
  try {
    send(
      res,
      await extraBedService.updateExtraBedType(req.params.id, req.body),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteExtraBedType = async (req, res) => {
  try {
    send(res, await extraBedService.deleteExtraBedType(req.params.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
