import { rest } from "msw";

type BasePathParams = {
  owner: string;
  repo: string;
};

type IssueCommentsPathParams = BasePathParams & {
  issue_number: string;
};

type IssueCommentPathParams = BasePathParams & {
  comment_id: string;
};

type PullRequestPathParams = BasePathParams & {
  pull_number: string;
};

type CommitStatusesPathParams = BasePathParams & {
  ref: string;
};

const githubUrl = (path: string) => `https://api.github.com${path}`;
const owner = "gr2m";
const repo = "merge-schedule-action";
const githubPullRequestUrl = (id: number) =>
  `https://github.com/${owner}/${repo}/pull/${id}`;
const pullRequests = [
  {
    number: 2,
    html_url: githubPullRequestUrl(2),
    state: "open",
    body: "Simple body\n/schedule 2022-06-08",
    head: {
      sha: "abc123success",
      repo: {
        fork: false,
      },
    },
    labels: [],
  },
  {
    number: 3,
    html_url: githubPullRequestUrl(3),
    state: "open",
    body: "Simple body\n/schedule 2022-06-09",
    head: {
      sha: "abc123pending",
      repo: {
        fork: false,
      },
    },
    labels: [],
  },
  {
    number: 4,
    html_url: githubPullRequestUrl(4),
    state: "open",
    body: "Simple body\n/schedule 2022-06-12",
    head: {
      sha: "abc123success",
      repo: {
        fork: false,
      },
    },
    labels: [],
  },
  {
    number: 13,
    html_url: githubPullRequestUrl(13),
    state: "open",
    body: "With conflicts body\n/schedule 2022-06-09",
    head: {
      sha: "abc123success",
      repo: {
        fork: false,
      },
    },
    labels: [],
  },
  {
    number: 5,
    html_url: githubPullRequestUrl(5),
    state: "open",
    body: "With automerge-fail label\n/schedule 2022-06-07",
    head: {
      sha: "abc123success",
      repo: {
        fork: false,
      },
    },
    labels: [
      {
        name: "automerge-fail",
      },
    ],
  },
  {
    number: 6,
    html_url: githubPullRequestUrl(6),
    state: "open",
    body: "With automerge-fail previous comment\n/schedule 2022-06-07",
    head: {
      sha: "abc123success",
      repo: {
        fork: false,
      },
    },
    labels: [],
  },
  {
    number: 7,
    html_url: githubPullRequestUrl(7),
    state: "open",
    body: "Simple body not schedule date\n/schedule",
    head: {
      sha: "abc123success",
      repo: {
        fork: false,
      },
    },
    labels: [],
  },
  {
    number: 14,
    html_url: githubPullRequestUrl(14),
    state: "open",
    body: "Simple body\n/schedule 2022-06-09",
    head: {
      sha: "abc123pending-empty",
      repo: {
        fork: false,
      },
    },
    labels: [],
  },
];
const pullRequestComments = pullRequests.map((pullRequest) => {
  let body = "";
  switch (pullRequest.number) {
    case 3:
      body = "<!-- Merge Schedule Pull Request Comment -->";
      break;
    case 4:
      body = `:hourglass: **Merge Schedule**\nScheduled to be merged on 2022-06-12 00:00:00 (UTC)\n<!-- Merge Schedule Pull Request Comment -->`;
      break;
    case 6:
      body = `:x: **Merge Schedule**\nScheduled merge failed: Pull Request is not mergeable\nIn order to let the automerge-automation try again, the label \\"automerge-fail\\" should be removed.\n<!-- Merge Schedule Pull Request Comment Fail -->`;
      break;
    default:
      body = "Sample comment";
      break;
  }
  const id = parseInt(`${pullRequest.number}1`, 10);
  return [
    {
      id,
      html_url: `https://github.com/${owner}/${repo}/issues/${pullRequest.number}#issuecomment-${id}`,
      body,
    },
  ];
});

export const githubHandlers = [
  // List pull request comments
  // https://docs.github.com/en/rest/issues/comments#list-issue-comments
  rest.get<{}, IssueCommentsPathParams>(
    githubUrl("/repos/:owner/:repo/issues/:issue_number/comments"),
    (req, res, ctx) => {
      const { issue_number } = req.params;
      const pullRequestIndex = pullRequests.findIndex(
        (item) => item.number === +issue_number
      );
      return res(
        ctx.status(200),
        ctx.json(pullRequestComments[pullRequestIndex])
      );
    }
  ),

  // Create pull request comment
  // https://docs.github.com/en/rest/issues/comments#create-an-issue-comment
  rest.post<{ body: string }, IssueCommentsPathParams>(
    githubUrl("/repos/:owner/:repo/issues/:issue_number/comments"),
    (req, res, ctx) => {
      const { issue_number } = req.params;
      const id = parseInt(`${issue_number}2`, 10);
      return res(
        ctx.status(201),
        ctx.json({
          id,
          html_url: `https://github.com/${owner}/${repo}/issues/${issue_number}#issuecomment-${id}`,
          body: req.body.body,
        })
      );
    }
  ),

  // Update pull request comment
  // https://docs.github.com/en/rest/issues/comments#update-an-issue-comment
  rest.patch<{ body: string }, IssueCommentPathParams>(
    githubUrl("/repos/:owner/:repo/issues/comments/:comment_id"),
    (req, res, ctx) => {
      const { comment_id } = req.params;
      const id = parseInt(comment_id, 10);
      const issueNumber = parseInt(comment_id.slice(0, -1), 10);
      return res(
        ctx.status(200),
        ctx.json({
          id,
          html_url: `https://github.com/${owner}/${repo}/issues/${issueNumber}#issuecomment-${id}`,
          body: req.body.body,
        })
      );
    }
  ),

  // Delete pull request comment
  // https://docs.github.com/en/rest/issues/comments#delete-an-issue-comment
  rest.delete<{}, IssueCommentPathParams>(
    githubUrl("/repos/:owner/:repo/issues/comments/:comment_id"),
    (req, res, ctx) => {
      return res(ctx.status(204));
    }
  ),

  // List pull requests
  // https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request
  rest.get<{}, BasePathParams>(
    githubUrl("/repos/:owner/:repo/pulls"),
    (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(pullRequests));
    }
  ),

  // Merge pull request
  // https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request
  rest.put<{}, PullRequestPathParams>(
    githubUrl("/repos/:owner/:repo/pulls/:pull_number/merge"),
    (req, res, ctx) => {
      const pullNumber = parseInt(req.params.pull_number, 10);

      if ([13, 6].includes(pullNumber)) {
        return res(
          ctx.status(405),
          ctx.json({
            message: "Pull Request is not mergeable",
            documentation_url:
              "https://docs.github.com/rest/reference/pulls#merge-a-pull-request",
          })
        );
      }

      return res(
        ctx.status(200),
        ctx.json({
          merged: true,
          message: "Pull Request successfully merged",
        })
      );
    }
  ),

  // Get the combined status for a specific reference
  // https://docs.github.com/en/rest/commits/statuses#get-the-combined-status-for-a-specific-reference
  rest.get<{}, CommitStatusesPathParams>(
    githubUrl("/repos/:owner/:repo/commits/:ref/status"),
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          state: req.params.ref.endsWith("success") ? "success" : "pending",
          statuses: req.params.ref.endsWith("pending-empty") ? [] : ["pending"],
        })
      );
    }
  ),

  // Lists check runs for a commit ref
  // https://docs.github.com/en/rest/checks/runs#list-check-runs-for-a-git-reference
  rest.get<{}, CommitStatusesPathParams>(
    githubUrl("/repos/:owner/:repo/commits/:ref/check-runs"),
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          total_count: 1,
          check_runs: [
            {
              status: "completed",
            },
          ],
        })
      );
    }
  ),

  // Add labels to an issue/pull request
  // https://docs.github.com/en/rest/issues/labels#add-labels-to-an-issue
  rest.post<{ labels: string[] }, BasePathParams>(
    githubUrl("/repos/:owner/:repo/issues/:issue_number/labels"),
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(
          req.body.labels.map((label, index) => ({
            id: index + 1,
            node_id: `node-${index + 1}`,
            url: `https://api.github.com/repos/${owner}/${repo}/labels/${label}`,
            name: label,
            description: null,
            color: "000000",
            default: false,
          }))
        )
      );
    }
  ),
];
