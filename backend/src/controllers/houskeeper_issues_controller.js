const issuesService = require("../services/houskeeper_issues_service");



exports.createIssue = async (req, res) => {
  try {
    console.log("========== CREATE ISSUE ==========");
    console.log("req.user:", req.user);
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    const result = await issuesService.createIssue(
      {
        ...req.body,
        reportedBy: req.user.name || req.user.role,
        reporterId: req.user.id,
        reporterRole: req.user.role,
      },
      req.files,
    );

    console.log("CREATE ISSUE RESULT:", result);

    return res.status(result.statusCode || 201).json(result);
  } catch (error) {
    console.error("createIssue failed:", error);

    return res.status(500).json({
      message: "createIssue failed",
      statusCode: 500,
      data: null,
      error: error.message,
    });
  }
};

// exports.createIssue = async (req, res) => {
//   try {
//     const result = await issuesService.createIssue(
//       {
//         ...req.body,
//         reportedBy: req.user.name || req.user.role,
//         reporterId: req.user.id,
//         reporterRole: req.user.role,
//       },
//       req.files,
//     );

//     return res.status(result.statusCode || 201).json(result);
//   } catch (error) {
//     console.error("createIssue failed:", error);
//     return res.status(500).json({
//       message: "createIssue failed",
//       statusCode: 500,
//       data: null,
//       error: error.message,
//     });
//   }
// };

exports.getIssues = async (req, res) => {
  try {
    const result = await issuesService.getIssues();

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    console.error("getIssues failed:", error);

    return res.status(500).json({
      message: "getIssues failed",
      statusCode: 500,
      data: null,
      error: error.message,
    });
  }
};

exports.getIssueById = async (req, res) => {
  try {
    const result = await issuesService.getIssueById(req.params.id);

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    console.error("getIssueById failed:", error);

    return res.status(500).json({
      message: "getIssueById failed",
      statusCode: 500,
      data: null,
      error: error.message,
    });
  }
};