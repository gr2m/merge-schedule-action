module.exports = handleSchedule;

const core = require("@actions/core");
const { Octokit } = require("@octokit/action");
const { commentHeader } = require("./comment");
const localeDate = require("./locale_date");

/**
 * handle "schedule" event
 */
async function handleSchedule() {
  const octokit = new Octokit();
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

  const mergeMethod = process.env.INPUT_MERGE_METHOD;

  core.info(`Loading open pull request`);
  const pullRequests = await octokit.paginate(
    octokit.pulls.list,
    {
      owner,
      repo,
      state: "open",
    },
    (response) => {
      return response.data
        .filter((pullRequest) => hasScheduleCommand(pullRequest))
        .filter((pullRequest) => isntFromFork(pullRequest))
        .map((pullRequest) => {
          return {
            number: pullRequest.number,
            html_url: pullRequest.html_url,
            scheduledDate: getScheduleDateString(pullRequest.body),
            ref: pullRequest.head.sha,
            headSha: pullRequest.head.sha,
          };
        });
    }
  );

  core.info(`${pullRequests.length} scheduled pull requests found`);

  if (pullRequests.length === 0) {
    return;
  }

  const duePullRequests = pullRequests.filter(
    (pullRequest) => new Date(pullRequest.scheduledDate) < localeDate()
  );

  core.info(`${duePullRequests.length} due pull requests found`);

  if (duePullRequests.length === 0) {
    return;
  }

  for await (const pullRequest of duePullRequests) {
    await octokit.pulls.merge({
      owner,
      repo,
      pull_number: pullRequest.number,
      merge_method: mergeMethod,
    });

    const prComments = await octokit.paginate(
      octokit.rest.issues.listComments,
      {
        owner,
        repo,
        issue_number: pullRequest.number,
      },
      (response) => {
        return response.data.filter((comment) =>
          comment.body?.includes(commentHeader)
        );
      }
    );
    const previousComment = prComments.pop();
    if (previousComment) {
      const { data } = await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: previousComment.id,
        body: `Scheduled on ${pullRequest.scheduledDate} successfully merged.\n${commentHeader}`,
      });
      core.info(`Comment updated: ${data.html_url}`);
    }

    core.info(`${pullRequest.html_url} merged`);
  }
}

function hasScheduleCommand(pullRequest) {
  return /(^|\n)\/schedule /.test(pullRequest.body);
}

function isntFromFork(pullRequest) {
  return !pullRequest.head.repo.fork;
}

function getScheduleDateString(text) {
  return text.match(/(^|\n)\/schedule (.*)/).pop();
}
