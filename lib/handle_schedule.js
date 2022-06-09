const core = require("@actions/core");
const { Octokit } = require("@octokit/action");
const { getPreviousComment, updateComment } = require("./comment");
const localeDate = require("./locale_date");
const { getScheduleDateString, hasScheduleCommand, isFork } = require("./utils");

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
        .filter((pullRequest) => hasScheduleCommand(pullRequest.body))
        .filter((pullRequest) => !isFork(pullRequest))
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
    core.info(`${pullRequest.html_url} merged`);

    const previousComment = await getPreviousComment(
      octokit,
      pullRequest.number
    );
    if (previousComment) {
      const { data } = await updateComment(
        octokit,
        previousComment.id,
        `Scheduled on ${pullRequest.scheduledDate} successfully merged.`
      );
      core.info(`Comment updated: ${data.html_url}`);
    }
  }
}

module.exports = handleSchedule;
