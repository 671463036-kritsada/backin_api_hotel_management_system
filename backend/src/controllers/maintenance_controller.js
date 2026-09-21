const maintenanceService = require("../services/maintenance_service");

exports.getReports = async (req, res) => {
  try {
    const result = await maintenanceService.getAllReports();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.addReport = async (req, res) => {
  try {
    const { room, item, level, reporter } = req.body;

    if (!room || !item) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกหมายเลขห้องและรายการที่ชำรุด",
      });
    }

    // path ตรงกับที่ maintenance_upload_middleware เซฟจริง (src/uploads/maintenance/<filename>)
    const imagePath = req.file
      ? `uploads/maintenance/${req.file.filename}`
      : null;

    const data = {
      room,
      item,
      level: level || "ปกติ",
      reportedDate: new Date().toISOString().split("T")[0],
      status: "รอการตรวจสอบ",
      reporter: reporter || req.user?.name || "ผู้ดูแลระบบ",
      image: imagePath,
    };

    const result = await maintenanceService.addReport(data);
    res
      .status(201)
      .json({ success: true, message: "บันทึกสำเร็จ", data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log("=== TOGGLE STATUS ===");
    console.log("id:", id);
    console.log("status from frontend:", status);

    const STATUS_CYCLE = {
      'รอการตรวจสอบ': "กำลังซ่อม",
      'กำลังซ่อม': "ซ่อมเสร็จแล้ว",
      'ซ่อมเสร็จแล้ว': "รอการตรวจสอบ",
    };

    const nextStatus = STATUS_CYCLE[status];

    console.log("nextStatus:", nextStatus);

    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message: `สถานะ "${status}" ไม่ถูกต้อง`,
      });
    }

    const result = await maintenanceService.updateStatus(id, nextStatus);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("toggleStatus error:", err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// exports.toggleStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const STATUS_CYCLE = {
//       'รอซ่อม': 'กำลังซ่อม',
//       'กำลังซ่อม': 'ซ่อมเสร็จแล้ว',
//       'ซ่อมเสร็จแล้ว': 'รอซ่อม',
//     };
//     const nextStatus = STATUS_CYCLE[status];
//     if (!nextStatus) {
//       return res.status(400).json({ success: false, message: `สถานะ "${status}" ไม่ถูกต้อง` });
//     }

//     const result = await maintenanceService.updateStatus(id, nextStatus);
//     res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };
