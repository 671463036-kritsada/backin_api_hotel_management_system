const issuesService = require("../services/houskeeper_issues_service");

exports.createIssue = async (req, res) => {
  try {
    console.log("createIssue body:", req.body);
    const result = await issuesService.createIssue(req.body);
    res.status(result.statusCode || 201).json(result);
  } catch (err) {
    res.status(500).json({ message: "createIssue failed", error: err.message });
  }
};

exports.getIssues = async (req, res) => {
  try {
    const result = await issuesService.getIssues();
    res.status(result.statusCode || 200).json(result);
  } catch (err) {
    res.status(500).json({ message: "getIssues failed", error: err.message });
  }
};

exports.getIssueById = async (req, res) => {
  try {
    const result = await issuesService.getIssueById(req.params.id);
    res.status(result.statusCode || 200).json(result);
  } catch (err) {
    res
      .status(500)
      .json({ message: "getIssueById failed", error: err.message });
  }
};
