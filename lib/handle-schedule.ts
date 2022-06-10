import * as core from "@actions/core";
import * as github from "@actions/github";
import type { SimplePullRequest } from "@octokit/webhooks-types";
import {
  createComment,
  generateBody,
  getPreviousComment,
  updateComment,
} from "./comment";
import localeDate from "./locale-date";
import {
  getScheduleDateString,
  hasScheduleCommand,
  isFork,
  isValidMergeMethod,
} from "./utils";

/**
 * handle "schedule" event
 */
export default async function handleSchedule(): Promise<void> {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  if (!process.env.GITHUB_TOKEN) {
    core.setFailed(`GITHUB_TOKEN environment variable is not set`);
    process.exit(1);
  }

  const mergeMethod = process.env.INPUT_MERGE_METHOD;
  if (!isValidMergeMethod(mergeMethod)) {
    core.setFailed(`merge_method "${mergeMethod}" is invalid`);
    process.exit(1);
  }

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

  core.info(`Loading open pull requests`);
  const pullRequests = await octokit.paginate(
    octokit.rest.pulls.list,
    {
      owner,
      repo,
      state: "open",
    },
    (response) => {
      return response.data
        .filter((pullRequest) => !isFork(pullRequest as SimplePullRequest))
        .filter((pullRequest) => hasScheduleCommand(pullRequest.body))
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
    await octokit.rest.pulls.merge({
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

    const commentBody = generateBody(
      `Scheduled on ${pullRequest.scheduledDate} successfully merged`,
      `success`
    );

    if (previousComment) {
      const { data } = await updateComment(
        octokit,
        previousComment.id,
        commentBody
      );
      core.info(`Comment updated: ${data.html_url}`);
      continue;
    }

    const { data } = await createComment(
      octokit,
      pullRequest.number,
      commentBody
    );
    core.info(`Comment created: ${data.html_url}`);
  }
}
