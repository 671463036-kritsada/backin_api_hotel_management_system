// สุ่มรหัสตัวเลข 6 หลัก เช่น "839201"
function generateRoomKey() {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

module.exports = { generateRoomKey };