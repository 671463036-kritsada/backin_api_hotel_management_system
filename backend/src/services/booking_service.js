const bookingModel = require("../models/booking_model");
const roomModel = require("../models/room_model");

const checkinModel = require("../models/checkin_model");
const { createPromptPayPayload } = require("../utils/promptpay_qr");

function toSqlDate(value) {
  if (!value) return null;
  const datePart = String(value).match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePart) return datePart;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

async function createBooking(userId, customerName, data) {
  data.user_id = userId;
  data.customer_name = customerName;

  const roomId = data.room_id || data.roomId;
  const checkIn = data.check_in || data.checkInDate;
  const checkOut = data.check_out || data.checkOutDate;

  if (!roomId || !checkIn || !checkOut) {
    return {
      success: false,
      message: "กรุณาระบุห้อง วันที่เช็คอิน และเช็คเอาท์",
    };
  }
  if (new Date(checkIn) >= new Date(checkOut)) {
    return {
      success: false,
      message: "วันที่เช็คเอาท์ต้องอยู่หลังวันที่เช็คอิน",
    };
  }

  const isAvailable = await roomModel.isRoomAvailable(
    roomId,
    checkIn,
    checkOut,
  );
  if (!isAvailable) {
    return {
      success: false,
      message: "ห้องนี้ถูกจองไปแล้วในช่วงวันที่ที่เลือก",
    };
  }

  const result = await bookingModel.createBooking(data);
  if (result && result.insertId) {
    // ไม่ต้องอัปเดต room status เอง — คำนวณสดจาก booking ตอน getRooms() อยู่แล้ว
    const booking = await bookingModel.getBookingById(result.insertId);
    return { success: true, data: booking };
  }
  return { success: false, message: "create failed" };
}

async function createCartBooking(userId, customerName, data) {
  if (!Array.isArray(data.items) || data.items.length === 0) {
    return { success: false, message: "ไม่พบห้องพักในตะกร้า" };
  }

  for (const item of data.items) {
    const roomId = item.roomId || item.room_id;
    const checkIn = toSqlDate(item.checkInDate || item.check_in);
    const checkOut = toSqlDate(item.checkOutDate || item.check_out);
    if (!roomId || !checkIn || !checkOut) {
      return {
        success: false,
        message: "กรุณาระบุห้อง วันที่เช็คอิน และเช็คเอาท์ให้ครบทุกห้อง",
      };
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      return {
        success: false,
        message: "วันที่เช็คเอาท์ต้องอยู่หลังวันที่เช็คอิน",
      };
    }
  }

  const result = await bookingModel.createCartBookings({
    ...data,
    user_id: userId,
    customer_name: customerName,
  });

  const promptPayId = process.env.PROMPTPAY_ID;
  if (!promptPayId) {
    throw new Error("ยังไม่ได้ตั้งค่า PROMPTPAY_ID ใน backend .env");
  }

  return {
    success: true,
    data: {
      ...result,
      qrPayload: createPromptPayPayload(promptPayId, result.depositAmount),
    },
  };
}

async function checkIn(id, data) {
  return bookingModel.updateCheckInStatus(id, data);
}

async function checkOut(id, status = "CHECKED_OUT") {
  // sync ไปที่ checkins table ด้วย ถ้ามี record checkin ของ booking นี้อยู่
  const checkin = await checkinModel.getCheckInByBookingId(id);
  if (checkin) {
    await checkinModel.checkOutCheckin(checkin.id);
  }
  return bookingModel.updateCheckOutStatus(id, status);
}

async function getBookings() {
  const data = await bookingModel.getBookings();
  return { success: true, data };
}

async function getPendingBookings() {
  const data = await bookingModel.getPendingBookings();
  return { success: true, data };
}

async function getMyBookings(userId) {
  const data = await bookingModel.getBookingsByUserId(userId);
  return { success: true, data };
}

async function getBookingById(id) {
  const data = await bookingModel.getBookingById(id);
  if (!data) return { success: false, message: "booking not found" };
  return { success: true, data };
}

async function updateBooking(id, data) {
  const oldBooking = await bookingModel.getBookingById(id);
  if (!oldBooking) return { success: false, message: "booking not found" };

  const result = await bookingModel.updateBooking(id, data);
  if (result.affectedRows === 0)
    return { success: false, message: "booking not found" };

  // ตัดส่วน roomModel.updateRoomStatus ออกทั้งหมด (ไม่ต้องแก้ room เวลาเปลี่ยนห้อง เพราะคำนวณสดอยู่แล้ว)

  const booking = await bookingModel.getBookingById(id);
  return { success: true, data: booking };
}

async function deleteBooking(id, requester) {
  return bookingModel.cancelBooking(id, requester);
}

module.exports = {
  createBooking,
  createCartBooking,
  checkIn,
  checkOut,
  getBookings,
  getPendingBookings,
  getMyBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
