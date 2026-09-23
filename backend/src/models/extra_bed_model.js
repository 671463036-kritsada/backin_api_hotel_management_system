const db = require("../config/db");

function response(data, message = "success", statusCode = 200) {
  return { data, message, statusCode };
}

async function getExtraBedTypes({ includeInactive = false } = {}) {
  const [rows] = await db.execute(
    `SELECT id, name, description, price, max_child_age AS maxChildAge,
            is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
     FROM extra_bed_types
     ${includeInactive ? "" : "WHERE is_active = 1"}
     ORDER BY id DESC`,
  );
  return response(rows);
}

async function createExtraBedType(data) {
  const name = String(data.name || "").trim();
  const price = Number(data.price);
  const maxChildAge =
    data.maxChildAge == null || data.maxChildAge === ""
      ? null
      : Number(data.maxChildAge);

  if (!name || !Number.isFinite(price) || price < 0) {
    return response(null, "กรุณาระบุชื่อและราคาที่ถูกต้อง", 400);
  }

  const [result] = await db.execute(
    `INSERT INTO extra_bed_types (name, description, price, max_child_age, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [name, data.description || null, price, maxChildAge],
  );
  return response({ id: result.insertId }, "สร้างประเภทเตียงเสริมสำเร็จ", 201);
}

async function updateExtraBedType(id, data) {
  const fields = [];
  const values = [];
  if (data.name !== undefined) {
    const name = String(data.name).trim();
    if (!name) return response(null, "ชื่อต้องไม่ว่าง", 400);
    fields.push("name = ?");
    values.push(name);
  }
  if (data.description !== undefined) {
    fields.push("description = ?");
    values.push(data.description || null);
  }
  if (data.price !== undefined) {
    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0)
      return response(null, "ราคาไม่ถูกต้อง", 400);
    fields.push("price = ?");
    values.push(price);
  }
  if (data.maxChildAge !== undefined) {
    fields.push("max_child_age = ?");
    values.push(
      data.maxChildAge === "" || data.maxChildAge == null
        ? null
        : Number(data.maxChildAge),
    );
  }
  if (data.isActive !== undefined) {
    fields.push("is_active = ?");
    values.push(data.isActive ? 1 : 0);
  }
  if (!fields.length) return response(null, "ไม่มีข้อมูลสำหรับแก้ไข", 400);

  values.push(id);
  const [result] = await db.execute(
    `UPDATE extra_bed_types SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
    values,
  );
  if (!result.affectedRows) return response(null, "ไม่พบประเภทเตียงเสริม", 404);
  return response({ id: Number(id) }, "แก้ไขประเภทเตียงเสริมสำเร็จ");
}

async function deleteExtraBedType(id) {
  const [references] = await db.execute(
    `SELECT
       (SELECT COUNT(*) FROM bookings WHERE extra_bed_type_id = ?) AS bookingCount,
       (SELECT COUNT(*) FROM cart WHERE extra_bed_type_id = ?) AS cartCount`,
    [id, id],
  );
  if (references[0].bookingCount > 0 || references[0].cartCount > 0) {
    return response(
      null,
      "ลบไม่ได้ เนื่องจากประเภทเตียงเสริมนี้ถูกใช้งานใน booking หรือ cart แล้ว ให้ปิดใช้งานแทน",
      409,
    );
  }

  const [result] = await db.execute(
    "DELETE FROM extra_bed_types WHERE id = ?",
    [id],
  );
  if (!result.affectedRows) return response(null, "ไม่พบประเภทเตียงเสริม", 404);
  return response({ id: Number(id) }, "ลบประเภทเตียงเสริมสำเร็จ");
}

module.exports = {
  getExtraBedTypes,
  createExtraBedType,
  updateExtraBedType,
  deleteExtraBedType,
};
