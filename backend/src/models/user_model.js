const db = require("../config/db");

exports.findUserByName = async (name) => {
  const sql = `
    SELECT *
    FROM users
    WHERE name = ?
  `;
  try {
    const [rows] = await db.query(sql, [name]);
    return rows[0];
  } catch (err) {
    throw new Error(`findUserByName failed: ${err.message}`);
  }
};


exports.findUserById = async (id) => {
  const sql = `
    SELECT id, name, email, phone, role, status, address, join_date, created_at
    FROM users
    WHERE id = ?
  `;
  try {
    const [rows] = await db.query(sql, [id]);
    return rows[0];
  } catch (err) {
    throw new Error(`findUserById failed: ${err.message}`);
  }
};

exports.getAllUsers = async () => {
  const sql = `
    SELECT id, name, email, phone, role, status, address, join_date, created_at
    FROM users
  `;
  try {
    const [rows] = await db.query(sql);
    return rows;
  } catch (err) {
    throw new Error(`getAllUsers failed: ${err.message}`);
  }
};

exports.getUsersNotAllowed = async () => {
  const sql = `
    SELECT id, name, email
    FROM users
    WHERE status = ?
  `;
  try {
    const [rows] = await db.query(sql, ["inactive"]);
    return rows;
  } catch (err) {
    throw new Error(`getUsersNotAllowed failed: ${err.message}`);
  }
};

exports.updateUserStatus = async (id, status) => {
  const sql = `
    UPDATE users
    SET status = ?
    WHERE id = ?
  `;
  try {
    const [result] = await db.query(sql, [status, id]);
    return result;
  } catch (err) {
    throw new Error(`updateUserStatus failed: ${err.message}`);
  }
};

exports.deleteUser = async (id) => {
  const sql = `
    DELETE FROM users
    WHERE id = ?
  `;
  try {
    const [result] = await db.query(sql, [id]);
    return result;
  } catch (err) {
    throw new Error(`deleteUser failed: ${err.message}`);
  }
};