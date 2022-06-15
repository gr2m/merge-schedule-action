import { rest } from "msw";

const githubUrl = (path: string) => `https://api.github.com${path}`;

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

export const githubHandlers = [
  // List pull request comments
  // https://docs.github.com/en/rest/issues/comments#list-issue-comments
  rest.get<{}, IssueCommentsPathParams>(
    githubUrl("/repos/:owner/:repo/issues/:issue_number/comments"),
    (req, res, ctx) => {
      const { owner, repo, issue_number } = req.params;
      return res(
        ctx.status(200),
        ctx.json([
          {
            id: 1,
            html_url: `https://github.com/${owner}/${repo}/issues/${issue_number}#issuecomment-1`,
            body:
              issue_number === "4"
                ? `:hourglass: **Merge Schedule**\nScheduled to be merged on 2022-06-12 00:00:00 (UTC)\n<!-- Merge Schedule Pull Request Comment -->`
                : issue_number === "3"
                ? "<!-- Merge Schedule Pull Request Comment -->"
                : "Sample comment",
          },
        ])
      );
    }
  ),

  // Create pull request comment
  // https://docs.github.com/en/rest/issues/comments#create-an-issue-comment
  rest.post<{ body: string }, IssueCommentsPathParams>(
    githubUrl("/repos/:owner/:repo/issues/:issue_number/comments"),
    (req, res, ctx) => {
      const { owner, repo, issue_number } = req.params;
      return res(
        ctx.status(201),
        ctx.json({
          id: 2,
          html_url: `https://github.com/${owner}/${repo}/issues/${issue_number}#issuecomment-2`,
          body: req.body.body || "",
        })
      );
    }
  ),

  // Update pull request comment
  // https://docs.github.com/en/rest/issues/comments#update-an-issue-comment
  rest.patch<{ body: string }, IssueCommentPathParams>(
    githubUrl("/repos/:owner/:repo/issues/comments/:comment_id"),
    (req, res, ctx) => {
      const { owner, repo, comment_id } = req.params;
      const id = parseInt(comment_id, 10);
      return res(
        ctx.status(200),
        ctx.json({
          id,
          html_url: `https://github.com/${owner}/${repo}/issues/2#issuecomment-${id}`,
          body: req.body.body || "",
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
      const { owner, repo } = req.params;
      return res(
        ctx.status(200),
        ctx.json([
          {
            number: 2,
            html_url: `https://github.com/${owner}/${repo}/pull/2`,
            state: "open",
            body: "Simple body\n/schedule 2022-06-08",
            head: {
              repo: {
                fork: false,
              },
            },
          },
          {
            number: 3,
            html_url: `https://github.com/${owner}/${repo}/pull/3`,
            state: "open",
            body: "Simple body\n/schedule 2022-06-09",
            head: {
              repo: {
                fork: false,
              },
            },
          },
          {
            number: 4,
            html_url: `https://github.com/${owner}/${repo}/pull/4`,
            state: "open",
            body: "Simple body\n/schedule 2022-06-12",
            head: {
              repo: {
                fork: false,
              },
            },
          },
        ])
      );
    }
  ),

  // Merge pull request
  // https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request
  rest.put<{}, BasePathParams>(
    githubUrl("/repos/:owner/:repo/pulls/:pull_number/merge"),
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          merged: true,
          message: "Pull Request successfully merged",
        })
      );
    }
  ),
];
