import type { SimplePullRequest } from "@octokit/webhooks-types";

export function hasScheduleCommand(text: string | null): boolean {
  if (!text) return false;
  return /(^|\n)\/schedule /.test(text);
}

export function isFork(pullRequest: SimplePullRequest): boolean {
  return pullRequest.head.repo.fork;
}

export function getScheduleDateString(text: string | null): string {
  if (!text) return "";
  return text.match(/(^|\n)\/schedule (.*)/)?.pop() ?? "";
}

type MergeMethod = "merge" | "squash" | "rebase";

export function isValidMergeMethod(method: string): method is MergeMethod {
  return ["merge", "squash", "rebase"].includes(method);
}

/**
 * @reference https://stackoverflow.com/a/1353711/206879
 */
export function isValidDate(datestring: string): boolean {
  const date = new Date(datestring);
  return date instanceof Date && !isNaN(date as unknown as number);
}

export function stringifyDate(datestring: string): string {
  const dateTimeString = new Date(datestring).toISOString().split(`.`)[0];
  const [date, time] = dateTimeString.split(`T`);
  return `${date} ${time}`;
}
