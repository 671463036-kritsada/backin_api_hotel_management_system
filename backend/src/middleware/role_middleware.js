exports.isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    // role ใน database เป็น string เช่น "Admin", "User", "housekeeper"
    if (req.user.role?.toLowerCase() !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin only",
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
