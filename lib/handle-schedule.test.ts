import mockDate from "mockdate";
import timezoneMock from "timezone-mock";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { mockProcessStdout } from "vitest-mock-process";
import handleSchedule from "./handle-schedule";
import * as comment from "./comment";

timezoneMock.register("UTC");
mockDate.set("2022-06-10T00:00:00.000Z");

beforeEach(() => {
  process.env.INPUT_MERGE_METHOD = "merge";
});

describe("handleSchedule", () => {
  test("invalid merge method", async () => {
    const mockStdout = mockProcessStdout();
    process.env.INPUT_MERGE_METHOD = "bad-method";

    await handleSchedule();

    expect(mockStdout.mock.calls).toEqual([
      [`::error::merge_method "bad-method" is invalid\n`],
    ]);
  });

  test("due pull requests", async () => {
    const mockStdout = mockProcessStdout();
    const createComment = vi.spyOn(comment, "createComment");
    const updateComment = vi.spyOn(comment, "updateComment");

    await handleSchedule();

    expect(mockStdout.mock.calls).toEqual([
      [`Loading open pull requests\n`],
      [`4 scheduled pull requests found\n`],
      [`3 due pull requests found\n`],
      [`https://github.com/gr2m/merge-schedule-action/pull/2 merged\n`],
      [
        `Comment created: https://github.com/gr2m/merge-schedule-action/issues/2#issuecomment-2\n`,
      ],
      [`https://github.com/gr2m/merge-schedule-action/pull/3 merged\n`],
      [
        `Comment updated: https://github.com/gr2m/merge-schedule-action/issues/2#issuecomment-1\n`,
      ],
      [
        `Comment created: https://github.com/gr2m/merge-schedule-action/issues/13#issuecomment-2\n`,
      ],
    ]);
    expect(createComment.mock.calls).toHaveLength(2);
    expect(createComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":white_check_mark: **Merge Schedule**
      Scheduled on 2022-06-08 (UTC) successfully merged
      <!-- Merge Schedule Pull Request Comment -->"
    `);
    expect(createComment.mock.calls[1][2]).toMatchInlineSnapshot(`
      ":x: **Merge Schedule**
      Scheduled merge failed: Pull Request is not mergeable
      <!-- Merge Schedule Pull Request Comment -->"
    `);
    expect(updateComment.mock.calls).toHaveLength(1);
    expect(updateComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":white_check_mark: **Merge Schedule**
      Scheduled on 2022-06-09 (UTC) successfully merged
      <!-- Merge Schedule Pull Request Comment -->"
    `);
  });

  test("due pull requests with require_statuses_success = true", async () => {
    const mockStdout = mockProcessStdout();
    process.env.INPUT_REQUIRE_STATUSES_SUCCESS = "true";
    const createComment = vi.spyOn(comment, "createComment");
    const updateComment = vi.spyOn(comment, "updateComment");

    await handleSchedule();

    expect(mockStdout.mock.calls).toEqual([
      [`Loading open pull requests\n`],
      [`4 scheduled pull requests found\n`],
      [`3 due pull requests found\n`],
      [`https://github.com/gr2m/merge-schedule-action/pull/2 merged\n`],
      [
        `Comment created: https://github.com/gr2m/merge-schedule-action/issues/2#issuecomment-2\n`,
      ],
      [
        `https://github.com/gr2m/merge-schedule-action/pull/3 is not ready to be merged yet because all checks are not completed or statuses are not success\n`,
      ],
      [
        `Comment created: https://github.com/gr2m/merge-schedule-action/issues/13#issuecomment-2\n`,
      ],
    ]);
    expect(createComment.mock.calls).toHaveLength(2);
    expect(createComment.mock.calls[0][2]).toMatchInlineSnapshot(`
      ":white_check_mark: **Merge Schedule**
      Scheduled on 2022-06-08 (UTC) successfully merged
      <!-- Merge Schedule Pull Request Comment -->"
    `);
    expect(createComment.mock.calls[1][2]).toMatchInlineSnapshot(`
      ":x: **Merge Schedule**
      Scheduled merge failed: Pull Request is not mergeable
      <!-- Merge Schedule Pull Request Comment -->"
    `);
    expect(updateComment.mock.calls).toHaveLength(0);
  });
});
