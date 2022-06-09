const core = require("@actions/core");
const { Octokit } = require("@octokit/action");
const {
  createComment,
  deleteComment,
  getPreviousComment,
  updateComment,
} = require("./comment");
const localeDate = require("./locale_date");
const {
  getScheduleDateString,
  hasScheduleCommand,
  isFork,
  isValidDate,
} = require("./utils");

/**
 * Handle "pull_request" event
 */
async function handlePullRequest() {
  const octokit = new Octokit();

  const eventPayload = require(process.env.GITHUB_EVENT_PATH);
  const pullRequest = eventPayload.pull_request;

  core.info(
    `Handling pull request ${eventPayload.action} for ${pullRequest.html_url}`
  );

  if (pullRequest.state !== "open") {
    core.info(`Pull request already closed, ignoring`);
    return;
  }

  if (isFork(pullRequest)) {
    core.setFailed(`Setting a scheduled merge is not allowed from forks`);
    process.exit(1);
  }

  const previousComment = await getPreviousComment(
    octokit,
    pullRequest.number
  );
  const commentBody = `Scheduled to be merged on ${datestring}.`;

  if (!hasScheduleCommand(pullRequest.body)) {
    if (previousComment) {
      await deleteComment(octokit, previousComment.id);
    }
    core.info(`No /schedule command found`);
    return;
  }

  const datestring = getScheduleDateString(pullRequest.body);
  core.info(`Schedule date found: "${datestring}"`);

  if (!isValidDate(datestring)) {
    commentBody = `"${datestring}" is not a valid date.`;
  }

  if (new Date(datestring) < localeDate()) {
    commentBody = `"${datestring}" is already in the past.`;
  }

  if (previousComment) {
    const { data } = await updateComment(
      octokit,
      previousComment.id,
      commentBody
    );
    core.info(`Comment updated: ${data.html_url}`);
    return;
  }

  const { data } = await createComment(
    octokit,
    pullRequest.number,
    commentBody
  );
  core.info(`Comment created: ${data.html_url}`);
}

module.exports = handlePullRequest;
