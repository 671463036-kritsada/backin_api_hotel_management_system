const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authModel = require("../models/auth_model");

// REGISTER
exports.register = async (data) => {
  const requiredFields = ["name", "email", "password"];
  const missing = requiredFields.filter((field) => !data[field]);
  if (missing.length > 0) {
    throw new Error(`กรุณากรอกข้อมูลให้ครบ: ${missing.join(", ")}`);
  }

  const existingUser = await authModel.findByEmail(data.email);
  if (existingUser) {
    throw new Error("Email นี้ถูกใช้งานแล้ว");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const result = await authModel.createUser(data, passwordHash);

  return {
    success: true,
    message: "Register success",
    data: result,
  };
};

// LOGIN
exports.login = async ({ email, password }) => {
  const user = await authModel.findByEmail(email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (user.status !== "active") {
    throw new Error("บัญชีนี้ยังไม่ได้รับอนุญาตให้เข้าใช้งาน");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    success: true,
    message: "Login success",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};