const bookingModel = require("../models/booking_model");
const roomModel = require("../models/room_model");

const ROOM_STATUS = {
  AVAILABLE: "ว่าง",
  BOOKED: "จองแล้ว",
  OCCUPIED: "เข้าพักแล้ว",
};

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

  // เช็คว่าห้องนี้ว่างในช่วงวันที่ที่ขอจองไหม ก่อนจะสร้าง booking จริง
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
    await roomModel.updateRoomStatus(roomId, ROOM_STATUS.BOOKED);
    const booking = await bookingModel.getBookingById(result.insertId);
    return { success: true, data: booking };
  }
  return { success: false, message: "create failed" };
}

async function checkIn(id, data) {
  const result = await bookingModel.updateCheckInStatus(id, data);
  if (result.affectedRows > 0) {
    const booking = await bookingModel.getBookingById(id);
    if (booking && booking.room_id) {
      await roomModel.updateRoomStatus(booking.room_id, ROOM_STATUS.OCCUPIED);
    }
  }
  return result;
}

async function checkOut(id, status = "CHECKED_OUT") {
  const result = await bookingModel.updateCheckOutStatus(id, status);
  if (result.affectedRows > 0) {
    const booking = await bookingModel.getBookingById(id);
    if (booking && booking.room_id) {
      await roomModel.updateRoomStatus(booking.room_id, ROOM_STATUS.AVAILABLE);
    }
  }
  return result;
}

async function getBookings() {
  const data = await bookingModel.getBookings();
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

  const newRoomId = data.room_id || data.roomId;
  if (newRoomId && oldBooking.room_id && newRoomId !== oldBooking.room_id) {
    await roomModel.updateRoomStatus(oldBooking.room_id, ROOM_STATUS.AVAILABLE);
    await roomModel.updateRoomStatus(newRoomId, ROOM_STATUS.BOOKED);
  }

  const booking = await bookingModel.getBookingById(id);
  return { success: true, data: booking };
}

async function deleteBooking(id) {
  const booking = await bookingModel.getBookingById(id);
  if (!booking) return { success: false, message: "booking not found" };

  const result = await bookingModel.deleteBooking(id);
  if (result.affectedRows === 0)
    return { success: false, message: "booking not found" };

  if (booking.room_id) {
    await roomModel.updateRoomStatus(booking.room_id, ROOM_STATUS.AVAILABLE);
  }

  return { success: true, data: { id } };
}

module.exports = {
  createBooking,
  checkIn,
  checkOut,
  getBookings,
  getMyBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};

// const bookingModel = require("../models/booking_model");
// const roomModel = require("../models/room_model");

// const ROOM_STATUS = {
//   AVAILABLE: "ว่าง",
//   BOOKED: "จองแล้ว",
//   OCCUPIED: "เข้าพักแล้ว",
// };

// async function createBooking(userId, customerName, data) {
//   data.user_id = userId;
//   data.customer_name = customerName;

//   const result = await bookingModel.createBooking(data);

//   if (result && result.insertId) {
//     const roomId = data.room_id || data.roomId;
//     if (roomId) {
//       await roomModel.updateRoomStatus(roomId, ROOM_STATUS.BOOKED);
//     }

//     const booking = await bookingModel.getBookingById(result.insertId);
//     return {
//       success: true,
//       data: booking,
//     };
//   }
//   return {
//     success: false,
//     message: "create failed",
//   };
// }

// async function checkIn(id, data) {
//   const result = await bookingModel.updateCheckInStatus(id, data);

//   if (result.affectedRows > 0) {
//     const booking = await bookingModel.getBookingById(id);
//     if (booking && booking.room_id) {
//       await roomModel.updateRoomStatus(booking.room_id, ROOM_STATUS.OCCUPIED);
//     }
//   }

//   return result;
// }

// async function checkOut(id, status = "CHECKED_OUT") {
//   const result = await bookingModel.updateCheckOutStatus(id, status);

//   if (result.affectedRows > 0) {
//     const booking = await bookingModel.getBookingById(id);
//     if (booking && booking.room_id) {
//       await roomModel.updateRoomStatus(booking.room_id, ROOM_STATUS.AVAILABLE);
//     }
//   }

//   return result;
// }

// async function getBookings() {
//   const data = await bookingModel.getBookings();
//   return { success: true, data };
// }

// async function getMyBookings(userId) {
//   const data = await bookingModel.getBookingsByUserId(userId);
//   return { success: true, data };
// }

// async function getBookingById(id) {
//   const data = await bookingModel.getBookingById(id);
//   if (!data) return { success: false, message: "booking not found" };
//   return { success: true, data };
// }

// async function updateBooking(id, data) {
//   // ดึง booking เดิมไว้ก่อน เผื่อมีการเปลี่ยนห้อง จะได้รู้ room_id เก่าเพื่อคืนสถานะ "ว่าง"
//   const oldBooking = await bookingModel.getBookingById(id);
//   if (!oldBooking) return { success: false, message: "booking not found" };

//   const result = await bookingModel.updateBooking(id, data);
//   if (result.affectedRows === 0)
//     return { success: false, message: "booking not found" };

//   const newRoomId = data.room_id || data.roomId;
//   if (newRoomId && oldBooking.room_id && newRoomId !== oldBooking.room_id) {
//     // ย้ายห้อง: คืนสถานะห้องเก่าเป็น "ว่าง" แล้วตั้งห้องใหม่เป็น "จองแล้ว"
//     await roomModel.updateRoomStatus(oldBooking.room_id, ROOM_STATUS.AVAILABLE);
//     await roomModel.updateRoomStatus(newRoomId, ROOM_STATUS.BOOKED);
//   }

//   const booking = await bookingModel.getBookingById(id);
//   return { success: true, data: booking };
// }

// async function deleteBooking(id) {
//   // ดึง booking ไว้ก่อนลบ เพื่อรู้ว่าต้องคืนสถานะห้องไหน
//   const booking = await bookingModel.getBookingById(id);
//   if (!booking) return { success: false, message: "booking not found" };

//   const result = await bookingModel.deleteBooking(id);
//   if (result.affectedRows === 0)
//     return { success: false, message: "booking not found" };

//   if (booking.room_id) {
//     await roomModel.updateRoomStatus(booking.room_id, ROOM_STATUS.AVAILABLE);
//   }

//   return { success: true, data: { id } };
// }

// module.exports = {
//   createBooking,
//   checkIn,
//   checkOut,
//   getBookings,
//   getMyBookings,
//   getBookingById,
//   updateBooking,
//   deleteBooking,
// };
