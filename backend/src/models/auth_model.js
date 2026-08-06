const db = require("../config/db");

// หา user ด้วย email (ใช้ทั้ง login และเช็ค email ซ้ำตอน register)
exports.findByEmail = async (email) => {
  const sql = `
    SELECT *
    FROM users
    WHERE email = ?
  `;
  const [rows] = await db.query(sql, [email]);
  return rows[0];
};

// สร้าง id ถัดไปแบบ U001, U002, ...
const generateNextUserId = async () => {
  const sql = `
    SELECT id FROM users
    ORDER BY id DESC
    LIMIT 1
  `;
  const [rows] = await db.query(sql);
  if (rows.length === 0) return "U001";

  const lastNumber = parseInt(rows[0].id.slice(1), 10);
  const nextNumber = lastNumber + 1;
  return "U" + String(nextNumber).padStart(3, "0");
};

// สร้าง user ใหม่
exports.createUser = async (data, passwordHash) => {
  const id = await generateNextUserId();

  const sql = `
    INSERT INTO users
    (id, name, email, phone, password, role, status, address, join_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    id,
    data.name,
    data.email,
    data.phone || null,
    passwordHash,
    "User",           // role default
    "active",         // status default
    data.address || null,
    data.join_date || new Date().toISOString().slice(0, 10),
  ];

  const [result] = await db.query(sql, values);
  return { ...result, id };
};