const authService = require("../services/auth_service");

// REGISTER
exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};