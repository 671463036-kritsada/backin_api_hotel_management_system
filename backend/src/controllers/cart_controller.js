const cartService = require("../services/cart_service");

exports.getCart = async (req, res) => {
  try {
    res.json(await cartService.getCart(req.user.id));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addItem = async (req, res) => {
  try {
    const result = await cartService.addItem(req.user.id, req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const result = await cartService.removeItem(req.user.id, req.params.id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clear = async (req, res) => {
  try {
    res.json(await cartService.clear(req.user.id));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
