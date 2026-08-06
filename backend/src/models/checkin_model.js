const mockCheckIns = [];

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

exports.createCheckIn = async (data) => {
  if (repository && typeof repository.createCheckIn === "function") {
    return repository.createCheckIn(data);
  }

  const checkin = {
    id: mockCheckIns.length + 1,
    bookingId: data.bookingId,
    idCardNumber: data.idCardNumber,
    fullName: data.fullName,
    gender: data.gender,
    address: data.address,
    idCardImage: data.idCardImage,
    signatureImage: data.signatureImage,
    paymentSlipImage: data.paymentSlipImage,
    createdAt: new Date().toISOString(),
  };

  mockCheckIns.push(checkin);
  return buildResponse(checkin, "checkin created", 201);
};

exports.getCheckIns = async () => {
  if (repository && typeof repository.getCheckIns === "function") {
    return repository.getCheckIns();
  }

  return buildResponse(mockCheckIns);
};

exports.getCheckInById = async (id) => {
  if (repository && typeof repository.getCheckInById === "function") {
    return repository.getCheckInById(id);
  }

  const item = mockCheckIns.find((it) => it.id === Number(id));
  if (!item) {
    return buildResponse(null, "checkin not found", 404);
  }

  return buildResponse(item);
};

exports.updateCheckIn = async (id, updates) => {
  if (repository && typeof repository.updateCheckIn === "function") {
    return repository.updateCheckIn(id, updates);
  }

  const idx = mockCheckIns.findIndex((it) => it.id === Number(id));
  if (idx === -1) {
    return buildResponse(null, "checkin not found", 404);
  }

  const item = mockCheckIns[idx];
  const updated = Object.assign({}, item, updates, {
    updatedAt: new Date().toISOString(),
  });
  mockCheckIns[idx] = updated;
  return buildResponse(updated, "checkin updated", 200);
};

exports.mockCheckIns = mockCheckIns;
exports.setRepository = setRepository;
