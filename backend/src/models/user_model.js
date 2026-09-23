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

exports.updateUserProfile = async (id, { name, phone, address }) => {
  const sql = `
    UPDATE users
    SET name = ?, phone = ?, address = ?
    WHERE id = ?
  `;
  try {
    const [result] = await db.query(sql, [name, phone, address, id]);
    return result;
  } catch (err) {
    throw new Error(`updateUserProfile failed: ${err.message}`);
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
  const [users] = await db.query(
    `SELECT id, role FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  if (!users.length) {
    return { success: false, statusCode: 404, message: "ไม่พบผู้ใช้งาน" };
  }
  if (String(users[0].role).toLowerCase() === "admin") {
    return {
      success: false,
      statusCode: 403,
      message: "ไม่สามารถลบบัญชีผู้ดูแลระบบได้ ให้ระงับการใช้งานแทน",
    };
  }

  const [references] = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM bookings WHERE user_id = ?) AS bookingsCount,
       (SELECT COUNT(*) FROM cart WHERE user_id = ?) AS cartCount,
       (SELECT COUNT(*) FROM user_promotions WHERE user_id = ?) AS couponsCount`,
    [id, id, id],
  );
  const reference = references[0];
  if (
    reference.bookingsCount > 0 ||
    reference.cartCount > 0 ||
    reference.couponsCount > 0
  ) {
    return {
      success: false,
      statusCode: 409,
      message:
        "ลบไม่ได้ เนื่องจากผู้ใช้นี้มีข้อมูลการจอง ตะกร้า หรือคูปองอยู่ ให้ระงับการใช้งานแทน",
    };
  }

  const sql = `
    DELETE FROM users
    WHERE id = ?
  `;
  try {
    const [result] = await db.query(sql, [id]);
    return {
      success: true,
      statusCode: 200,
      message: "User Deleted",
      data: result,
    };
  } catch (err) {
    throw new Error(`deleteUser failed: ${err.message}`);
  }
};
