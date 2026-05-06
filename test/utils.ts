import crypto from "crypto";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { resolve } from "path";

const tempPath = resolve(__dirname, "../node_modules/.tmp/test-mocks");

export function setupWebhooksFolder() {
  mkdirSync(tempPath, { recursive: true });
}

export function cleanupWebhooksFolder() {
  rmSync(tempPath, { recursive: true });
}

type PullRequestWebhookOptions = {
  number?: number;
  state?: "open" | "closed";
  body?: string;
  fork?: boolean;
  headRepo?: { fork?: boolean } | null;
};

export function generatePullRequestWebhook({
  number = 2,
  state = "open",
  body = "Simple body",
  fork = false,
  headRepo = undefined,
}: PullRequestWebhookOptions = {}) {
  // https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#webhook-payload-example-33
  const payload = {
    action: state === "closed" ? "closed" : "opened",
    pull_request: {
      html_url: `https://github.com/gr2m/merge-schedule-action/pull/${number}`,
      number,
      state,
      body,
      head: {
        repo: headRepo ?? {
          fork,
        },
      },
    },
  };
  const id = crypto.randomBytes(20).toString("hex");
  const filePath = resolve(tempPath, `pull-request-${id}.json`);
  writeFileSync(filePath, JSON.stringify(payload), { encoding: "utf8" });
  return filePath;
}
