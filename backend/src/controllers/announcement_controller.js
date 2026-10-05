const announcementService = require("../services/announcement_service");

function send(res, result) {
  return res.status(result.statusCode || 200).json(result);
}

exports.getActiveAnnouncements = async (req, res) => {
  try {
    send(res, await announcementService.getActiveAnnouncements());
  } catch (error) {
    res
      .status(500)
      .json({ message: "โหลดข่าวสารไม่สำเร็จ", error: error.message });
  }
};

exports.getAllAnnouncements = async (req, res) => {
  try {
    send(res, await announcementService.getAllAnnouncements());
  } catch (error) {
    res
      .status(500)
      .json({ message: "โหลดแบนเนอร์ไม่สำเร็จ", error: error.message });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    send(res, await announcementService.createAnnouncement(req.body, req.file));
  } catch (error) {
    res
      .status(500)
      .json({ message: "เพิ่มแบนเนอร์ไม่สำเร็จ", error: error.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    send(
      res,
      await announcementService.updateAnnouncement(
        req.params.id,
        req.body,
        req.file,
      ),
    );
  } catch (error) {
    res
      .status(500)
      .json({ message: "บันทึกแบนเนอร์ไม่สำเร็จ", error: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    send(res, await announcementService.deleteAnnouncement(req.params.id));
  } catch (error) {
    res
      .status(500)
      .json({ message: "ลบแบนเนอร์ไม่สำเร็จ", error: error.message });
  }
};
