import mockDate from "mockdate";
import timezoneMock from "timezone-mock";
import { describe, test, expect, vi, afterAll, beforeAll } from "vitest";
import { mockProcessStdout } from "vitest-mock-process";
import {
  generatePullRequestWebhook,
  cleanupWebhooks,
  setupWebhooks,
} from "../test/utils";
import handlePullRequest from "./handle-pull-request";
import * as comment from "./comment";

timezoneMock.register("UTC");
mockDate.set("2022-06-10T00:00:00.000Z");

describe("handlePullRequest", () => {
  beforeAll(() => {
    setupWebhooks();
  });

  afterAll(() => {
    cleanupWebhooks();
  });

  test("closed pull request", async () => {
    const mockStdout = mockProcessStdout();
    const eventPath = generatePullRequestWebhook({ state: "closed" });
    process.env.GITHUB_EVENT_PATH = eventPath;

    await handlePullRequest();

    expect(mockStdout.mock.calls).toEqual([
      [
        "Handling pull request closed for https://github.com/gr2m/merge-schedule-action/pull/2\n",
      ],
      ["Pull request already closed, ignoring\n"],
    ]);
  });

  test("fork pull request", async () => {
    const mockStdout = mockProcessStdout();
    const eventPath = generatePullRequestWebhook({ fork: true });
    process.env.GITHUB_EVENT_PATH = eventPath;

    await handlePullRequest();

    expect(mockStdout.mock.calls).toEqual([
      [
        "Handling pull request opened for https://github.com/gr2m/merge-schedule-action/pull/2\n",
      ],
      ["::error::Setting a scheduled merge is not allowed from forks\n"],
    ]);
  });

  test("no schedule command", async () => {
    const mockStdout = mockProcessStdout();
    const eventPath = generatePullRequestWebhook();
    process.env.GITHUB_EVENT_PATH = eventPath;

    await handlePullRequest();

    expect(mockStdout.mock.calls).toEqual([
      [
        "Handling pull request opened for https://github.com/gr2m/merge-schedule-action/pull/2\n",
      ],
      ["No /schedule command found\n"],
    ]);
  });

  test("no schedule command with previous commit", async () => {
    const mockStdout = mockProcessStdout();
    const eventPath = generatePullRequestWebhook({ number: 3 });
    process.env.GITHUB_EVENT_PATH = eventPath;

    await handlePullRequest();

    expect(mockStdout.mock.calls).toEqual([
      [
        "Handling pull request opened for https://github.com/gr2m/merge-schedule-action/pull/3\n",
      ],
      ["No /schedule command found\n"],
    ]);
  });

  test("invalid date", async () => {
    const mockStdout = mockProcessStdout();
    const createComment = vi.spyOn(comment, "createComment");
    const eventPath = generatePullRequestWebhook({
      body: "Pull request body\n/schedule bad-date",
    });
    process.env.GITHUB_EVENT_PATH = eventPath;

    await handlePullRequest();

    expect(mockStdout.mock.calls).toEqual([
      [
        "Handling pull request opened for https://github.com/gr2m/merge-schedule-action/pull/2\n",
      ],
      [`Schedule date found: "bad-date"\n`],
      [
        `Comment created: https://github.com/gr2m/merge-schedule-action/issues/2#issuecomment-2\n`,
      ],
    ]);
    expect(createComment.mock.calls).toHaveLength(1);
    expect(createComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":x: **Merge Schedule**
      \\"bad-date\\" is not a valid date
      <!-- Merge Schedule Pull Request Comment -->"
    `);
  });

  test("date in the past", async () => {
    const mockStdout = mockProcessStdout();
    const createComment = vi.spyOn(comment, "createComment");
    const eventPath = generatePullRequestWebhook({
      body: "Pull request body\n/schedule 2022-06-08",
    });
    process.env.GITHUB_EVENT_PATH = eventPath;

    await handlePullRequest();

    expect(mockStdout.mock.calls).toEqual([
      [
        "Handling pull request opened for https://github.com/gr2m/merge-schedule-action/pull/2\n",
      ],
      [`Schedule date found: "2022-06-08"\n`],
      [
        `Comment created: https://github.com/gr2m/merge-schedule-action/issues/2#issuecomment-2\n`,
      ],
    ]);
    expect(createComment.mock.calls).toHaveLength(1);
    expect(createComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":warning: **Merge Schedule**
      2022-06-08 00:00:00 (UTC) is already in the past
      <!-- Merge Schedule Pull Request Comment -->"
    `);
  });

  test("date in the past - custom time zone", async () => {
    const mockStdout = mockProcessStdout();
    const createComment = vi.spyOn(comment, "createComment");
    const eventPath = generatePullRequestWebhook({
      body: "Pull request body\n/schedule 2022-06-08",
    });
    process.env.GITHUB_EVENT_PATH = eventPath;
    process.env.INPUT_TIME_ZONE = "Europe/Lisbon";

    await handlePullRequest();

    expect(mockStdout.mock.calls).toEqual([
      [
        "Handling pull request opened for https://github.com/gr2m/merge-schedule-action/pull/2\n",
      ],
      [`Schedule date found: "2022-06-08"\n`],
      [
        `Comment created: https://github.com/gr2m/merge-schedule-action/issues/2#issuecomment-2\n`,
      ],
    ]);
    expect(createComment.mock.calls).toHaveLength(1);
    expect(createComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":warning: **Merge Schedule**
      2022-06-08 00:00:00 (UTC) is already in the past on Europe/Lisbon time zone
      <!-- Merge Schedule Pull Request Comment -->"
    `);
  });

  test("schedule merge", async () => {
    const mockStdout = mockProcessStdout();
    const createComment = vi.spyOn(comment, "createComment");
    const eventPath = generatePullRequestWebhook({
      body: "Pull request body\n/schedule 2022-06-12",
    });
    process.env.GITHUB_EVENT_PATH = eventPath;

    await handlePullRequest();

    expect(mockStdout.mock.calls).toEqual([
      [
        "Handling pull request opened for https://github.com/gr2m/merge-schedule-action/pull/2\n",
      ],
      [`Schedule date found: "2022-06-12"\n`],
      [
        `Comment created: https://github.com/gr2m/merge-schedule-action/issues/2#issuecomment-2\n`,
      ],
    ]);
    expect(createComment.mock.calls).toHaveLength(1);
    expect(createComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":hourglass: **Merge Schedule**
      Scheduled to be merged on 2022-06-12 00:00:00 (UTC)
      <!-- Merge Schedule Pull Request Comment -->"
    `);
  });

  test("schedule merge with previous commit", async () => {
    const mockStdout = mockProcessStdout();
    const updateComment = vi.spyOn(comment, "updateComment");
    const eventPath = generatePullRequestWebhook({
      body: "Pull request body\n/schedule 2022-06-12",
      number: 3,
    });
    process.env.GITHUB_EVENT_PATH = eventPath;

    await handlePullRequest();

    expect(mockStdout.mock.calls).toEqual([
      [
        "Handling pull request opened for https://github.com/gr2m/merge-schedule-action/pull/3\n",
      ],
      [`Schedule date found: "2022-06-12"\n`],
      [
        `Comment updated: https://github.com/gr2m/merge-schedule-action/issues/2#issuecomment-1\n`,
      ],
    ]);
    expect(updateComment.mock.calls).toHaveLength(1);
    expect(updateComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":hourglass: **Merge Schedule**
      Scheduled to be merged on 2022-06-12 00:00:00 (UTC)
      <!-- Merge Schedule Pull Request Comment -->"
    `);
  });

  test("schedule merge with previous commit already up to date", async () => {
    const mockStdout = mockProcessStdout();
    const updateComment = vi.spyOn(comment, "updateComment");
    const eventPath = generatePullRequestWebhook({
      body: "Pull request body\n/schedule 2022-06-12",
      number: 4,
    });
    process.env.GITHUB_EVENT_PATH = eventPath;

    await handlePullRequest();

    expect(mockStdout.mock.calls).toEqual([
      [
        "Handling pull request opened for https://github.com/gr2m/merge-schedule-action/pull/4\n",
      ],
      [`Schedule date found: "2022-06-12"\n`],
      ["Comment already up to date\n"],
    ]);
    expect(updateComment.mock.calls).toHaveLength(0);
  });
});
