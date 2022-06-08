module.exports = handlePullRequest;

const core = require("@actions/core");
const { Octokit } = require("@octokit/action");
const { commentHeader } = require('./comment');
const localeDate = require("./locale_date");

/**
 * Handle "pull_request" event
 */
async function handlePullRequest() {
  const octokit = new Octokit();

  const eventPayload = require(process.env.GITHUB_EVENT_PATH);

  core.info(
    `Handling pull request ${eventPayload.action} for ${eventPayload.pull_request.html_url}`
  );

  if (eventPayload.pull_request.state !== "open") {
    core.info(`Pull request already closed, ignoring`);
    return;
  }

  if (eventPayload.pull_request.head.repo.fork) {
    core.setFailed(`Setting a scheduled merge is not allowed from forks`);
    process.exit(1);
  }

  const prComments = await octokit.paginate(
    octokit.rest.issues.listComments,
    {
      owner: eventPayload.repository.owner.login,
      repo: eventPayload.repository.name,
      issue_number: eventPayload.pull_request.number,
    },
    (response) => {
      return response.data.filter((comment) =>
        comment.body?.includes(commentHeader)
      );
    }
  );
  const previousComment = prComments.pop();
  const commentPayload = {
    owner: eventPayload.repository.owner.login,
    repo: eventPayload.repository.name,
    body: `Scheduled to be merged on ${datestring}.`,
  };

  if (!hasScheduleCommand(eventPayload.pull_request.body)) {
    if (previousComment) {
      await octokit.rest.issues.deleteComment({
        owner: commentPayload.owner,
        repo: commentPayload.repo,
        comment_id: previousComment.id,
      });
    }
    core.info(`No /schedule command found`);
    return;
  }

  const datestring = getScheduleDateString(eventPayload.pull_request.body);
  core.info(`Schedule date found: "${datestring}"`);

  if (!isValidDate(datestring)) {
    commentPayload.body = `"${datestring}" is not a valid date.`;
  }

  if (new Date(datestring) < localeDate()) {
    commentPayload.body = `"${datestring}" is already in the past.`;
  }

  commentPayload.body = `${commentPayload.body}\n${commentHeader}`;

  if (previousComment) {
    const { data } = await octokit.rest.issues.updateComment({
      ...commentPayload,
      comment_id: previousComment.id,
    });
    core.info(`Comment updated: ${data.html_url}`);
    return;
  }

  const { data } = await octokit.rest.issues.createComment({
    ...commentPayload,
    issue_number: eventPayload.pull_request.number,
  });
  core.info(`Comment created: ${data.html_url}`);
}

function hasScheduleCommand(text) {
  return /(^|\n)\/schedule /.test(text);
}

function getScheduleDateString(text) {
  return text.match(/(^|\n)\/schedule (.*)/).pop();
}

// https://stackoverflow.com/a/1353711/206879
function isValidDate(datestring) {
  const date = new Date(datestring);
  return date instanceof Date && !Number.isNaN(date);
}
