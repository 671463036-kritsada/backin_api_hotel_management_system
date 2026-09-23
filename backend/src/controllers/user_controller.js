// user.controller.js

const userService = require("../services/user_service");

exports.getUsers = async (req, res) => {
  try {
    const result = await userService.getUsers();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// exports.getMyProfile = async (req, res) => {
//     try {
//         const { id } = req.user  // มาจาก token ที่ authMiddleware decode ไว้
//         const result = await userService.getUserById(id)
//         res.status(200).json({ success: true, data: result })
//     } catch (err) {
//         console.error(err)
//         res.status(500).json({ success: false, message: 'Server Error' })
//     }
// }

exports.getMyProfile = async (req, res) => {
  try {
    const { id } = req.user; // มาจาก token ที่ authMiddleware decode ไว้
    const result = await userService.getUserById(id);
    if (!result) {
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    }
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);

    res.status(500).json({ success: false, message: "Server Error" });
    if (err.message && err.message.includes("Data too long")) {
      return res.status(400).json({
        success: false,
        message: "ข้อมูลที่กรอกยาวเกินไป กรุณาตรวจสอบอีกครั้ง",
      });
    }
  }
};

// exports.getMyProfile = async (req, res) => {
//   try {
//     const userId = req.user.id; // มาจาก auth middleware ที่ decode JWT
//     const user = await userQueries.findUserById(userId);

//     if (!user) {
//       return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้งาน" });
//     }

//     return res.status(200).json({ success: true, data: user });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// PUT /users/me — แก้ไขโปรไฟล์ตัวเอง (name, phone, address เท่านั้น)

exports.updateMyProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "กรุณากรอกชื่อ" });
    }

    const updatedUser = await userService.updateUserProfile(id, {
      name,
      phone,
      address,
    });

    res.status(200).json({
      success: true,
      message: "อัปเดตโปรไฟล์สำเร็จ",
      data: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// exports.updateMyProfile = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { name, phone, address } = req.body;

//     if (!name || !name.trim()) {
//       return res.status(400).json({ success: false, message: "กรุณากรอกชื่อ" });
//     }

//     await userQueries.updateUserProfile(userId, { name, phone, address });

//     // ดึงข้อมูลล่าสุดกลับไปให้ client ใช้อัปเดต state ทันที
//     const updatedUser = await userQueries.findUserById(userId);

//     return res.status(200).json({
//       success: true,
//       message: "อัปเดตโปรไฟล์สำเร็จ",
//       data: updatedUser,
//     });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.getUsersNotAllowed = async (req, res) => {
  try {
    const result = await userService.getUsersNotAllowed();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.allowUser = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "id จำเป็นต้องระบุ" });
    }
    const result = await userService.allowUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "id จำเป็นต้องระบุ" });
    }
    const result = await userService.blockUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "id จำเป็นต้องระบุ" });
    }
    const result = await userService.deleteUser(id, req.user.id);
    res.status(result.statusCode || 200).json(result);
  } catch (err) {
    console.error(err);
    res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};
