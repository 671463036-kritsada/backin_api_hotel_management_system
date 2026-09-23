const furnitureService = require("../services/furniture_service");

exports.getFurniture = async (req, res) => {
  try {
    const { roomId, bookingId = "" } = req.query;

    if (!roomId) {
      return res.status(400).json({
        message: "roomId จำเป็นต้องระบุ",
        statusCode: 400,
        data: [],
      });
    }

    const result = await furnitureService.getFurniture(roomId, bookingId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("getFurniture failed:", error);

    return res.status(500).json({
      message: "getFurniture failed",
      statusCode: 500,
      data: [],
      error: error.message,
    });
  }
};

exports.submitReport = async (req, res) => {
  try {
    const inspectorId = req.user?.id;
    const inspectorRole = req.user?.role;

    if (!req.body.items) {
      return res.status(400).json({
        message: "items จำเป็นต้องระบุ",
        statusCode: 400,
        data: null,
      });
    }

    const items = JSON.parse(req.body.items);

    console.log("submitReport body:", req.body);
    console.log("submitReport files:", req.files);

    // แปลง req.files → object
    const files = {};

    for (const file of req.files || []) {
      console.log("📸 FILE RECEIVED:", {
        fieldname: file.fieldname,
        originalname: file.originalname,
        filename: file.filename,
        path: file.path,
      });

      files[file.fieldname] = `uploads/furniture/${file.filename}`;
    }

    console.log("📸 FILE PATHS:", files);

    const result = await furnitureService.submitReport(
      items,
      inspectorId,
      inspectorRole,
      files,
    );

    return res.status(result.statusCode || 201).json(result);
  } catch (error) {
    console.error("submitReport failed:", error);

    return res.status(500).json({
      message: "submitReport failed",
      statusCode: 500,
      data: null,
      error: error.message,
    });
  }
};

exports.confirmUserCondition = async (req, res) => {
  try {
    const bookingId = req.body.bookingId || req.body.booking_id;
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId จำเป็นต้องระบุ" });
    }
    const result = await furnitureService.confirmUserCondition(
      bookingId,
      req.user.id,
    );
    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "confirm furniture condition failed",
      error: error.message,
    });
  }
};

// const furnitureService = require("../services/furniture_service");

// exports.getFurniture = async (req, res) => {
//   try {
//     const { roomId, bookingId = "" } = req.query;

//     if (!roomId) {
//       return res.status(400).json({
//         message: "roomId จำเป็นต้องระบุ",
//         statusCode: 400,
//         data: [],
//       });
//     }

//     const result = await furnitureService.getFurniture(
//       roomId,
//       bookingId,
//     );

//     return res.status(200).json(result);
//   } catch (error) {
//     console.error("getFurniture failed:", error);

//     return res.status(500).json({
//       message: "getFurniture failed",
//       statusCode: 500,
//       data: [],
//       error: error.message,
//     });
//   }
// };

// exports.submitReport = async (req, res) => {
//   try {
//     const inspectorId = req.user?.id;
//     const inspectorRole = req.user?.role;

//     if (!req.body.items) {
//       return res.status(400).json({
//         message: "items จำเป็นต้องระบุ",
//         statusCode: 400,
//         data: null,
//       });
//     }

//     const items = JSON.parse(req.body.items);

//     const result = await furnitureService.submitReport(
//       items,
//       inspectorId,
//       inspectorRole,
//       req.files || [],
//     );

//     return res
//       .status(result.statusCode || 201)
//       .json(result);
//   } catch (error) {
//     console.error("submitReport failed:", error);

//     return res.status(500).json({
//       message: "submitReport failed",
//       statusCode: 500,
//       data: null,
//       error: error.message,
//     });
//   }
// };

// const furnitureService = require("../services/furniture_service");

// exports.getFurniture = async (req, res) => {
//   try {
//     const { roomId, bookingId = "" } = req.query;

//     if (!roomId) {
//       return res.status(400).json({
//         message: "roomId จำเป็นต้องระบุ",
//         statusCode: 400,
//         data: [],
//       });
//     }

//     const result = await furnitureService.getFurniture(
//       roomId,
//       bookingId
//     );

//     return res.status(200).json(result);
//   } catch (error) {
//     console.error("getFurniture failed:", error);

//     return res.status(500).json({
//       message: "getFurniture failed",
//       statusCode: 500,
//       data: [],
//       error: error.message,
//     });
//   }
// };

// exports.submitReport = async (req, res) => {
//   try {
//     const inspectorId = req.user?.id;

//     const result = await furnitureService.submitReport(
//       req.body,
//       inspectorId
//     );

//     return res
//       .status(result.statusCode || 201)
//       .json(result);
//   } catch (error) {
//     return res.status(500).json({
//       message: "submitReport failed",
//       statusCode: 500,
//       data: null,
//       error: error.message,
//     });
//   }
// };
