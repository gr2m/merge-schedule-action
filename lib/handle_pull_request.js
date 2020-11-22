module.exports = handlePullRequest;

const core = require("@actions/core");
const { Octokit } = require("@octokit/action");
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

  if (!hasScheduleCommand(eventPayload.pull_request.body)) {
    core.info(`No /schedule command found`);
    return;
  }

  const datestring = getScheduleDateString(eventPayload.pull_request.body);
  core.info(`Schedule date found: "${datestring}"`);

  if (!isValidDate(datestring)) {
    const { data } = await octokit.checks.create({
      owner: eventPayload.repository.owner.login,
      repo: eventPayload.repository.name,
      name: "Merge Schedule",
      head_sha: eventPayload.pull_request.head.sha,
      conclusion: "failure",
      output: {
        title: `"${datestring}" is not a valid date`,
        summary: "TO BE DONE: add useful summary",
      },
    });
    core.info(`Check run created: ${data.html_url}`);
    return;
  }

  if (new Date(datestring) < localeDate()) {
    const { data } = await octokit.checks.create({
      owner: eventPayload.repository.owner.login,
      repo: eventPayload.repository.name,
      name: "Merge Schedule",
      head_sha: eventPayload.pull_request.head.sha,
      conclusion: "failure",
      output: {
        title: `"${datestring}" is already in the past`,
        summary: "TO BE DONE: add useful summary",
      },
    });
    core.info(`Check run created: ${data.html_url}`);
    return;
  }

  const { data } = await octokit.checks.create({
    owner: eventPayload.repository.owner.login,
    repo: eventPayload.repository.name,
    name: "Merge Schedule",
    head_sha: eventPayload.pull_request.head.sha,
    status: "in_progress",
    output: {
      title: `Scheduled to be merged on ${datestring}`,
      summary: "TO BE DONE: add useful summary",
    },
  });
  core.info(`Check run created: ${data.html_url}`);
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
  return date instanceof Date && !isNaN(date);
}
