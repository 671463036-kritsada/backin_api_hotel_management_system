const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_DIR = path.join(
  __dirname,
  "..",
  "uploads",
  "imageData",
  "announcements",
);

function buildResponse(data, message = "success", statusCode = 200) {
  return { data, message, statusCode };
}

function saveImage(file) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
  return `imageData/announcements/${filename}`;
}

function deleteImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("imageData/announcements/")) return;
  fs.unlink(path.join(__dirname, "..", "uploads", imageUrl), (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("delete banner image error:", error.message);
    }
  });
}

async function getActiveAnnouncements() {
  const [rows] = await db.execute(
    `SELECT id, title, content, image_url AS imageUrl, display_order AS displayOrder
    FROM announcements
     WHERE is_active = 1
     ORDER BY display_order ASC, id DESC`,
  );
  return rows;
}

async function getAllAnnouncements() {
  const [rows] = await db.execute(
    `SELECT id, title, content, image_url AS imageUrl, display_order AS displayOrder,
            is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
    FROM announcements
     ORDER BY display_order ASC, id DESC`,
  );
  return rows;
}

async function getAnnouncementById(id) {
  const [rows] = await db.execute(
    `SELECT id, title, content, image_url AS imageUrl, display_order AS displayOrder,
            is_active AS isActive
    FROM announcements WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function createAnnouncement(data, file) {
  const imageUrl = saveImage(file);
  try {
    const [result] = await db.execute(
      `INSERT INTO announcements (title, content, image_url, display_order, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.title,
        data.content,
        imageUrl,
        data.displayOrder,
        data.isActive ? 1 : 0,
      ],
    );
    return result.insertId;
  } catch (error) {
    deleteImage(imageUrl);
    throw error;
  }
}

async function updateAnnouncement(id, data, file) {
  const current = await getAnnouncementById(id);
  if (!current) return null;

  const nextImageUrl = file ? saveImage(file) : current.imageUrl;
  try {
    const [result] = await db.execute(
      `UPDATE announcements
       SET title = ?, content = ?, image_url = ?, display_order = ?, is_active = ?
       WHERE id = ?`,
      [
        data.title,
        data.content,
        nextImageUrl,
        data.displayOrder,
        data.isActive ? 1 : 0,
        id,
      ],
    );
    if (result.affectedRows > 0 && file) deleteImage(current.imageUrl);
    if (result.affectedRows === 0 && file) deleteImage(nextImageUrl);
    return result.affectedRows;
  } catch (error) {
    if (file) deleteImage(nextImageUrl);
    throw error;
  }
}

async function deleteAnnouncement(id) {
  const current = await getAnnouncementById(id);
  if (!current) return 0;
  const [result] = await db.execute("DELETE FROM announcements WHERE id = ?", [
    id,
  ]);
  if (result.affectedRows > 0) deleteImage(current.imageUrl);
  return result.affectedRows;
}

module.exports = {
  buildResponse,
  getActiveAnnouncements,
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
