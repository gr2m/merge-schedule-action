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
import { getCommitChecksRunsStatus, getCommitStatusesStatus } from "./commit";
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
  if (!process.env.GITHUB_TOKEN) {
    core.setFailed("GITHUB_TOKEN environment variable is not set");
    return;
  }

  const mergeMethod = process.env.INPUT_MERGE_METHOD;
  const requireStatusesSuccess =
    process.env.INPUT_REQUIRE_STATUSES_SUCCESS === "true";
  const automergeFailLabel = process.env.INPUT_AUTOMERGE_FAIL_LABEL;
  if (!isValidMergeMethod(mergeMethod)) {
    core.setFailed(`merge_method "${mergeMethod}" is invalid`);
    return;
  }

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

  core.info("Loading open pull requests");
  const pullRequests = await octokit.paginate(
    octokit.rest.pulls.list,
    {
      ...github.context.repo,
      state: "open",
    },
    (response) => {
      return response.data
        .filter((pullRequest) => !isFork(pullRequest as SimplePullRequest))
        .filter((pullRequest) => hasScheduleCommand(pullRequest.body))
        .filter((pullRequest) =>
          pullRequest.labels.every((label) => label.name !== automergeFailLabel)
        )
        .map((pullRequest) => {
          return {
            number: pullRequest.number,
            html_url: pullRequest.html_url,
            scheduledDate: getScheduleDateString(pullRequest.body),
            ref: pullRequest.head.sha,
          };
        });
    }
  );

  core.setOutput("scheduled_pull_requests", pullRequests);
  core.info(`${pullRequests.length} scheduled pull requests found`);

  if (pullRequests.length === 0) {
    return;
  }

  const duePullRequests = pullRequests.filter(
    (pullRequest) =>
      pullRequest.scheduledDate === "" ||
      new Date(pullRequest.scheduledDate) < localeDate()
  );

  core.info(`${duePullRequests.length} due pull requests found`);

  if (duePullRequests.length === 0) {
    return;
  }

  for await (const pullRequest of duePullRequests) {
    if (requireStatusesSuccess) {
      const [checkRunsStatus, statusesStatus] = await Promise.all([
        getCommitChecksRunsStatus(octokit, pullRequest.ref),
        getCommitStatusesStatus(octokit, pullRequest.ref),
      ]);
      if (checkRunsStatus !== "completed" || statusesStatus !== "success") {
        core.info(
          `${pullRequest.html_url} is not ready to be merged yet because all checks are not completed or statuses are not success`
        );
        continue;
      }
    }

    try {
      await octokit.rest.pulls.merge({
        ...github.context.repo,
        pull_number: pullRequest.number,
        merge_method: mergeMethod,
      });
      core.info(`${pullRequest.html_url} merged`);
    } catch (error) {
      const previousComment = await getPreviousComment(
        octokit,
        pullRequest.number,
        "fail"
      );
      const commentBody = generateBody(
        `Scheduled merge failed: ${
          (error as Error).message
        }\nIn order to let the automerge-automation try again, the label "${automergeFailLabel}" should be removed.`,
        "error",
        "fail"
      );
      if (previousComment) {
        const { data } = await updateComment(
          octokit,
          previousComment.id,
          commentBody
        );
        core.info(`Comment updated: ${data.html_url}`);
      } else {
        const { data } = await createComment(
          octokit,
          pullRequest.number,
          commentBody
        );
        core.info(`Comment created: ${data.html_url}`);
      }
      await octokit.rest.issues.addLabels({
        ...github.context.repo,
        issue_number: pullRequest.number,
        labels: [automergeFailLabel],
      });
      core.info(`Label added: "${automergeFailLabel}"`);
      continue;
    }

    const previousComment = await getPreviousComment(
      octokit,
      pullRequest.number
    );

    let commentBody = "";
    if (pullRequest.scheduledDate) {
      commentBody = generateBody(
        `Scheduled on ${pullRequest.scheduledDate} (UTC) successfully merged`,
        "success"
      );
    } else {
      commentBody = generateBody(
        `Scheduled on next cron expression successfully merged`,
        "success"
      );
    }

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
