import * as core from "@actions/core";
import * as github from "@actions/github";

import handlePullRequest from "./handle-pull-request";
import handleSchedule from "./handle-schedule";

main();

async function main() {
  core.setOutput("scheduled_pull_requests", []);
  try {
    if (github.context.eventName === "pull_request") {
      await handlePullRequest();
      return;
    }

    await handleSchedule();
  } catch (error) {
    core.setFailed(error as Error);
  }
}
