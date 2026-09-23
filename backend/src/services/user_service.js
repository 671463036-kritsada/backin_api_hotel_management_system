const userModel = require("../models/user_model");

exports.getUsers = async () => {
  return await userModel.getAllUsers();
};

// user.service.js
exports.getUserById = async (id) => {
  return await userModel.findUserById(id);
};

exports.updateUserProfile = async (id, { name, phone, address }) => {
  await userModel.updateUserProfile(id, { name, phone, address });
  return await userModel.findUserById(id);
};

exports.getUsersNotAllowed = async () => {
  return await userModel.getUsersNotAllowed();
};

exports.allowUser = async (data) => {
  const { id } = data;
  await userModel.updateUserStatus(id, "active");
  return { success: true, message: "User Allowed" };
};

exports.blockUser = async (data) => {
  const { id } = data;
  await userModel.updateUserStatus(id, "inactive");
  return { success: true, message: "User Blocked" };
};

exports.deleteUser = async (id, requesterId) => {
  if (id === requesterId) {
    return {
      success: false,
      statusCode: 400,
      message: "ไม่สามารถลบบัญชีของตัวเองได้",
    };
  }

  const result = await userModel.deleteUser(id);
  return result;
};
