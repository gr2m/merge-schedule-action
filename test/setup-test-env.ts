import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks";

process.env.GITHUB_TOKEN = "some-token-here";
process.env.GITHUB_REPOSITORY = "gr2m/merge-schedule-action";
process.env.INPUT_MERGE_METHOD = "merge";
process.env.INPUT_TIME_ZONE = "UTC";
process.env.INPUT_REQUIRE_STATUSES_SUCCESS = "false";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterAll(() => server.close());

afterEach(() => server.resetHandlers());
