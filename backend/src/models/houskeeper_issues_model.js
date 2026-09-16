const db = require("../config/db");
const fs = require("fs");
const path = require("path");

const UPLOAD_BASE = path.join(__dirname, "..", "uploads", "imageData", "issuesImage");

function saveIssueImages(files = []) {
  if (!files || files.length === 0) return [];
  if (!fs.existsSync(UPLOAD_BASE)) fs.mkdirSync(UPLOAD_BASE, { recursive: true });

  return files.map((file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `issue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const fullPath = path.join(UPLOAD_BASE, filename);
    fs.writeFileSync(fullPath, file.buffer);
    return `imageData/issuesImage/${filename}`; // เก็บ relative path แบบเดียวกับรูปห้องพัก
  });
}

function buildResponse(data, message = "success", statusCode = 200) {
  return { message, statusCode, data };
}

function parseImages(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
}

async function createIssue(payload, files = []) {
  const {
    roomNo,
    issueType,
    description = "",
    priority = "medium",
    reportedBy,
    reporterId,
    reporterRole,
  } = payload;

  if (!roomNo || !issueType) {
    return buildResponse(null, "roomNo และ issueType จำเป็นต้องระบุ", 400);
  }

  const [rooms] = await db.query(
    `
      SELECT id, COALESCE(NULLIF(building, 0), 1) AS building
      FROM rooms
      WHERE id = ?
      LIMIT 1
    `,
    [roomNo],
  );

  if (rooms.length === 0) {
    return buildResponse(null, "ไม่พบห้องที่ระบุ", 404);
  }

  // ✅ เปลี่ยนจากรับ images (URL string จาก Firebase) เป็นเขียนไฟล์ลง disk เอง
  const savedImagePaths = saveIssueImages(files);
  const imageValue = JSON.stringify(savedImagePaths);

  const [result] = await db.query(
    `
      INSERT INTO maintenance_reports
        (room_id, item, level, reported_date, status, reporter, reporter_id, reporter_role, image_url, notes)
      VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)
    `,
    [
      roomNo,
      issueType,
      priority,
      "รอการตรวจสอบ",
      reportedBy,
      reporterId,
      reporterRole,
      imageValue,
      description,
    ],
  );

  const [createdRows] = await db.query(
    `
      SELECT
        mr.id,
        mr.room_id AS roomNo,
        COALESCE(NULLIF(r.building, 0), 1) AS building,
        mr.item AS issueType,
        mr.notes AS description,
        mr.level AS priority,
        mr.status,
        mr.reporter AS reportedBy,
        mr.image_url AS imageUrl,
        mr.reported_date AS createdAt
      FROM maintenance_reports mr
      INNER JOIN rooms r ON r.id = mr.room_id
      WHERE mr.id = ?
      LIMIT 1
    `,
    [result.insertId],
  );

  const issue = createdRows[0];

  return buildResponse(
    { ...issue, building: String(issue.building), images: parseImages(issue.imageUrl) },
    "issue created",
    201,
  );
}

async function getIssues() {
  // เหมือนเดิมทุกอย่าง ไม่ต้องแก้ (parseImages ยังใช้ได้เหมือนเดิม
  // เพราะตอนนี้ image_url เก็บ relative path แทน URL เต็ม โครงสร้าง JSON array เหมือนเดิม)
  const [rows] = await db.query(`
    SELECT
      mr.id, mr.room_id AS roomNo,
      COALESCE(NULLIF(r.building, 0), 1) AS building,
      mr.item AS issueType, mr.notes AS description, mr.level AS priority,
      mr.status, mr.reporter AS reportedBy, mr.image_url AS imageUrl,
      mr.reported_date AS createdAt
    FROM maintenance_reports mr
    INNER JOIN rooms r ON r.id = mr.room_id
    ORDER BY mr.reported_date DESC, mr.id DESC
  `);

  const data = rows.map((item) => ({
    ...item,
    building: String(item.building),
    images: parseImages(item.imageUrl),
  }));

  return buildResponse(data);
}

async function getIssueById(id) {
  // เหมือนเดิม ไม่ต้องแก้
  const [rows] = await db.query(
    `
      SELECT
        mr.id, mr.room_id AS roomNo,
        COALESCE(NULLIF(r.building, 0), 1) AS building,
        mr.item AS issueType, mr.notes AS description, mr.level AS priority,
        mr.status, mr.reporter AS reportedBy, mr.image_url AS imageUrl,
        mr.reported_date AS createdAt
      FROM maintenance_reports mr
      INNER JOIN rooms r ON r.id = mr.room_id
      WHERE mr.id = ?
      LIMIT 1
    `,
    [Number(id)],
  );

  if (rows.length === 0) return buildResponse(null, "issue not found", 404);

  const issue = rows[0];
  return buildResponse({
    ...issue,
    building: String(issue.building),
    images: parseImages(issue.imageUrl),
  });
}

module.exports = { createIssue, getIssues, getIssueById };