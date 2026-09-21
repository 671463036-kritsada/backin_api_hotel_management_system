const db = require("../config/db");

exports.getAllReports = async () => {
  const sql = `
    SELECT
      CAST(id AS CHAR) AS id,
      room_id AS room,
      item,
      level,
      reported_date AS reportedDate,
      status,
      reporter,
      image_url AS image
    FROM maintenance_reports
    ORDER BY reported_date DESC, id DESC
  `;

  try {
    const [rows] = await db.query(sql);
    return rows;
  } catch (err) {
    throw new Error(`getAllReports failed: ${err.message}`);
  }
};

exports.addReport = async ({
  room,
  item,
  level,
  reportedDate,
  status,
  reporter,
  image,
}) => {
  const sql = `
    INSERT INTO maintenance_reports
      (room_id, item, level, reported_date, status, reporter, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(sql, [
      room,
      item,
      level,
      reportedDate,
      status,
      reporter,
      image,
    ]);

    return result.insertId;
  } catch (err) {
    throw new Error(`addReport failed: ${err.message}`);
  }
};

exports.findReportById = async (id) => {
  const sql = `
    SELECT
      CAST(id AS CHAR) AS id,
      room_id AS room,
      item,
      level,
      reported_date AS reportedDate,
      status,
      reporter,
      image_url AS image
    FROM maintenance_reports
    WHERE id = ?
  `;

  try {
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  } catch (err) {
    throw new Error(`findReportById failed: ${err.message}`);
  }
};

exports.updateStatus = async (id, status) => {
  const sql = `
    UPDATE maintenance_reports
    SET status = ?
    WHERE id = ?
  `;

  try {
    const [result] = await db.query(sql, [status, id]);
    return result;
  } catch (err) {
    throw new Error(`updateStatus failed: ${err.message}`);
  }
};