import * as github from "@actions/github";
import { GitHub } from "@actions/github/lib/utils";

type Octokit = InstanceType<typeof GitHub>;

export async function getCommitChecksRunsStatus(
  octokit: Octokit,
  commitRef: string
) {
  const { data } = await octokit.rest.checks.listForRef({
    ...github.context.repo,
    ref: commitRef,
  });

  if (data.total_count === 0) {
    return "completed";
  }

  if (data.check_runs.every((check) => check.status === "completed")) {
    return "completed";
  }

  return "in_progress";
}

export async function getCommitStatusesStatus(
  octokit: Octokit,
  commitRef: string
) {
  const { data } = await octokit.rest.repos.getCombinedStatusForRef({
    ...github.context.repo,
    ref: commitRef,
  });

  if (data.statuses === undefined || data.statuses.length === 0)
    return "success";

  return data.state as "success" | "pending" | "failure";
}
