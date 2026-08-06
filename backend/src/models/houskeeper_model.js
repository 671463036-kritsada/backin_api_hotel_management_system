function buildResponse(data, message = "success", statusCode = 200) {
  return {
    message,
    statusCode,
    data,
  };
}

function generateMockHousekeeper() {
  const items = [];
  for (let index = 0; index < 50; index++) {
    const floor = Math.floor(index / 10) + 1;
    const roomNum = (index % 10) + 1;
    const roomNo = `${floor}${String(roomNum).padStart(2, "0")}`;
    const statuses = [
      "ต้องทำความสะอาด",
      "ทำความสะอาดแล้ว",
      "รอการตรวจสอบ",
      "ปิดปรับปรุง",
    ];
    items.push({
      roomNo,
      status: statuses[index % 4],
      assignedTo: `แม่บ้าน ${(index % 6) + 1}`,
      lastCleaned: new Date(Date.now() - (index % 3) * 86400000).toISOString(),
      notes: index % 5 === 0 ? "พบความเสียหายเล็กน้อย" : "",
    });
  }

  return buildResponse(items);
}

exports.getHousekeeperData = async () => {
  return generateMockHousekeeper();
};
