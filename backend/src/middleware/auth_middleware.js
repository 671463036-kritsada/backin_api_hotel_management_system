const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization format",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

exports.isAdmin = (req, res, next) => {
  const role = String(req.user?.role || "").toLowerCase();

  if (role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin only",
    });
  }

  next();
};

exports.isHousekeeper = (req, res, next) => {
  const role = String(req.user?.role || "").toLowerCase();

  if (role !== "housekeeper" && role !== "แม่บ้าน") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Housekeeper only",
    });
  }

  next();
};


exports.isUserOrHousekeeper = (req, res, next) => {
  const role = String(req.user?.role || "").toLowerCase();

  if (role !== "user" &&
      role !== "housekeeper" &&
      role !== "แม่บ้าน") {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  next();
}