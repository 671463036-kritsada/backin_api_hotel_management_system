// แปลง ISO string (เช่น "2026-08-31T05:41:00.000Z") เป็นรูปแบบที่ MySQL DATETIME รับได้
function toMySQLDateTime(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;

  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

module.exports = { toMySQLDateTime };