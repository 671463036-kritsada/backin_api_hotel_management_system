function tlv(tag, value) {
  const text = String(value);
  return `${tag}${String(text.length).padStart(2, "0")}${text}`;
}

function crc16(payload) {
  let crc = 0xffff;
  for (const character of payload) {
    crc ^= character.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function normalizePromptPayId(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0"))
    return `0066${digits.slice(1)}`;
  if (digits.length === 13) return `0066${digits}`;
  throw new Error("PROMPTPAY_ID ไม่ถูกต้อง");
}

function createPromptPayPayload(promptPayId, amount) {
  const merchantAccount = [
    tlv("00", "A000000677010111"),
    tlv("01", normalizePromptPayId(promptPayId)),
  ].join("");
  const amountText = Number(amount).toFixed(2);
  const payload = [
    tlv("00", "01"),
    tlv("01", "12"),
    tlv("29", merchantAccount),
    tlv("52", "0000"),
    tlv("53", "764"),
    tlv("54", amountText),
    tlv("58", "TH"),
    tlv("59", "HOTEL"),
    tlv("60", "BANGKOK"),
    "6304",
  ].join("");
  return `${payload}${crc16(payload)}`;
}

module.exports = { createPromptPayPayload };
