const furnitureService = require("../services/furniture_admin_service");

function send(res, result) {
  return res.status(result.statusCode || 200).json(result);
}

exports.getFurniture = async (req, res) => {
  try {
    send(res, await furnitureService.getFurniture(req.query.roomId));
  } catch (error) {
    res.status(500).json({ message: error.message, data: [] });
  }
};

exports.createFurniture = async (req, res) => {
  try {
    const image = req.file
      ? `uploads/furniture/${req.file.filename}`
      : req.body.image;
    send(res, await furnitureService.createFurniture({ ...req.body, image }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFurniture = async (req, res) => {
  try {
    const image = req.file
      ? `uploads/furniture/${req.file.filename}`
      : undefined;
    send(
      res,
      await furnitureService.updateFurniture(req.params.id, {
        ...req.body,
        image,
      }),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFurniture = async (req, res) => {
  try {
    send(res, await furnitureService.deleteFurniture(req.params.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
