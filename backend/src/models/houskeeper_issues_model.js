const mockIssues = [];

function buildResponse(data, message = "success", statusCode = 200) {
  return { message, statusCode, data };
}

exports.createIssue = async (payload) => {
  const issue = {
    id: mockIssues.length + 1,
    roomNo: payload.roomNo,
    issueType: payload.issueType,
    description: payload.description || "",
    priority: payload.priority || "medium",
    images: payload.images || [],
    reportedBy: payload.reportedBy || "system",
    createdAt: new Date().toISOString(),
  };
  mockIssues.push(issue);
  return buildResponse(issue, "issue created", 201);
};

exports.getIssues = async () => {
  return buildResponse(mockIssues);
};

exports.getIssueById = async (id) => {
  const item = mockIssues.find((it) => it.id === Number(id));
  if (!item) return buildResponse(null, "issue not found", 404);
  return buildResponse(item);
};

exports.mockIssues = mockIssues;
