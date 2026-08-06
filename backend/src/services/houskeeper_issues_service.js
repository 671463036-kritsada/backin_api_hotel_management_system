const issuesModel = require("../models/houskeeper_issues_model");

async function createIssue(payload) {
  return issuesModel.createIssue(payload);
}

async function getIssues() {
  return issuesModel.getIssues();
}

async function getIssueById(id) {
  return issuesModel.getIssueById(id);
}

module.exports = { createIssue, getIssues, getIssueById };
