const mockFurniture = [
  {
    id: 1,
    roomId: 205,
    title: "เตียงนอน",
    image: "assets/images/furnitures/bed.jpg",
    inspections: [
      {
        inspectorId: 5,
        inspectorName: "แม่บ้าน สมหญิง",
        inspectorRole: "housekeeper",
        status: "ปกติ",
        note: null,
        damageImage: null,
        inspectedAt: "2026-02-14T09:00:00Z",
      },
    ],
  },
  {
    id: 2,
    roomId: 205,
    title: "เครื่องปรับอากาศ",
    image: "assets/images/furnitures/airconditioner.jpg",
    inspections: [
      {
        inspectorId: 5,
        inspectorName: "แม่บ้าน สมหญิง",
        inspectorRole: "housekeeper",
        status: "ปกติ",
        note: null,
        damageImage: null,
        inspectedAt: "2026-02-14T09:02:00Z",
      },
    ],
  },
  {
    id: 3,
    roomId: 205,
    title: "ตู้เย็น / มินิบาร์",
    image: "assets/images/furnitures/fridge.jpg",
    inspections: [
      {
        inspectorId: 5,
        inspectorName: "แม่บ้าน สมหญิง",
        inspectorRole: "housekeeper",
        status: "ปกติ",
        note: null,
        damageImage: null,
        inspectedAt: "2026-02-14T09:03:00Z",
      },
    ],
  },
  {
    id: 4,
    roomId: 205,
    title: "ทีวี และ รีโมท",
    image: "assets/images/furnitures/TV.jpg",
    inspections: [
      {
        inspectorId: 5,
        inspectorName: "แม่บ้าน สมหญิง",
        inspectorRole: "housekeeper",
        status: "ปกติ",
        note: null,
        damageImage: null,
        inspectedAt: "2026-02-14T09:04:00Z",
      },
    ],
  },
];

let repository = null;

function setRepository(repo) {
  repository = repo;
}

function buildResponse(data, message = "success", statusCode = 200) {
  return {
    message,
    statusCode,
    data,
  };
}

exports.getFurniture = async () => {
  if (repository && typeof repository.getFurniture === "function") {
    return repository.getFurniture();
  }

  return buildResponse(mockFurniture);
};

exports.getFurnitureById = async (id) => {
  if (repository && typeof repository.getFurnitureById === "function") {
    return repository.getFurnitureById(id);
  }

  const item = mockFurniture.find((entry) => entry.id === Number(id));
  if (!item) {
    return buildResponse(null, "furniture not found", 404);
  }

  return buildResponse(item);
};

exports.createFurniture = async (data) => {
  if (repository && typeof repository.createFurniture === "function") {
    return repository.createFurniture(data);
  }

  const newItem = {
    id: mockFurniture.length + 1,
    ...data,
  };

  mockFurniture.push(newItem);
  return buildResponse(newItem, "furniture created", 201);
};

exports.updateFurniture = async (id, data) => {
  if (repository && typeof repository.updateFurniture === "function") {
    return repository.updateFurniture(id, data);
  }

  const index = mockFurniture.findIndex((entry) => entry.id === Number(id));
  if (index === -1) {
    return buildResponse(null, "furniture not found", 404);
  }

  mockFurniture[index] = { ...mockFurniture[index], ...data, id: Number(id) };
  return buildResponse(mockFurniture[index]);
};

exports.deleteFurniture = async (id) => {
  if (repository && typeof repository.deleteFurniture === "function") {
    return repository.deleteFurniture(id);
  }

  const index = mockFurniture.findIndex((entry) => entry.id === Number(id));
  if (index === -1) {
    return buildResponse(null, "furniture not found", 404);
  }

  mockFurniture.splice(index, 1);
  return buildResponse({ id: Number(id) }, "furniture deleted");
};

exports.mockFurniture = mockFurniture;
exports.setRepository = setRepository;
