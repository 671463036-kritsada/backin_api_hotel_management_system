const announcementModel = require("../models/announcement_model");

function parseAnnouncementData(data) {
  const title = String(data.title || "").trim();
  const content = String(data.content ?? data.body ?? data.description ?? "");
  const displayOrder = Number(data.displayOrder ?? 0);
  const activeValue = data.isActive;
  const isActive =
    activeValue === true || activeValue === "1" || activeValue === 1;

  if (!title) {
    return { error: "กรุณาระบุชื่อข่าวสาร" };
  }
  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    return { error: "ลำดับการแสดงต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป" };
  }
  return { value: { title, content, displayOrder, isActive } };
}

async function getActiveAnnouncements() {
  return announcementModel.buildResponse(
    await announcementModel.getActiveAnnouncements(),
  );
}

async function getAllAnnouncements() {
  return announcementModel.buildResponse(
    await announcementModel.getAllAnnouncements(),
  );
}

async function createAnnouncement(data, file) {
  const parsed = parseAnnouncementData(data);
  if (parsed.error)
    return announcementModel.buildResponse(null, parsed.error, 400);
  if (!file)
    return announcementModel.buildResponse(null, "กรุณาเลือกรูปข่าวสาร", 400);

  const id = await announcementModel.createAnnouncement(parsed.value, file);
  return announcementModel.buildResponse(
    await announcementModel.getAnnouncementById(id),
    "เพิ่มข่าวสารสำเร็จ",
    201,
  );
}

async function updateAnnouncement(id, data, file) {
  const parsed = parseAnnouncementData(data);
  if (parsed.error)
    return announcementModel.buildResponse(null, parsed.error, 400);
  if (!(await announcementModel.getAnnouncementById(id))) {
    return announcementModel.buildResponse(null, "ไม่พบข่าวสารนี้", 404);
  }

  const updated = await announcementModel.updateAnnouncement(
    id,
    parsed.value,
    file,
  );
  if (!updated)
    return announcementModel.buildResponse(null, "ไม่พบข่าวสารนี้", 404);
  return announcementModel.buildResponse(
    await announcementModel.getAnnouncementById(id),
    "บันทึกข่าวสารสำเร็จ",
  );
}

async function deleteAnnouncement(id) {
  const deleted = await announcementModel.deleteAnnouncement(id);
  if (!deleted)
    return announcementModel.buildResponse(null, "ไม่พบข่าวสารนี้", 404);
  return announcementModel.buildResponse({ id }, "ลบข่าวสารสำเร็จ");
}

module.exports = {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
