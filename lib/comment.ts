import { GitHub } from "@actions/github/lib/utils";

type Octokit = InstanceType<typeof GitHub>;

const commentHeader = `**Merge Schedule**`;
const commentFooter = `<!-- Merge Schedule Pull Request Comment -->`;

export async function getPreviousComment(
  octokit: Octokit,
  pullRequestNumber: number
) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const prComments = await octokit.paginate(
    octokit.rest.issues.listComments,
    {
      owner,
      repo,
      issue_number: pullRequestNumber,
    },
    (response) => {
      return response.data.filter((comment) =>
        comment.body?.includes(commentFooter)
      );
    }
  );
  const previousComment = prComments.pop();
  return previousComment;
}

type State = `error` | `warning` | `pending` | `success`;

const statePrefix: Record<State, string> = {
  success: `:white_check_mark:`,
  error: `:x:`,
  warning: `:warning:`,
  pending: `:hourglass:`,
};

export function generateBody(body: string, state: State) {
  let newBody = body;
  if (!body.startsWith(commentHeader)) {
    newBody = `${commentHeader}\n${newBody}`;
  }
  if (!body.endsWith(commentFooter)) {
    newBody = `${newBody}\n${commentFooter}`;
  }
  return `${statePrefix[state]} ${newBody}`;
}

export async function createComment(
  octokit: Octokit,
  pullRequestNumber: number,
  body: string
) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  return octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullRequestNumber,
    body,
  });
}

export async function updateComment(
  octokit: Octokit,
  commentId: number,
  body: string
) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  return octokit.rest.issues.updateComment({
    owner,
    repo,
    comment_id: commentId,
    body,
  });
}

export async function deleteComment(octokit: Octokit, commentId: number) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  return octokit.rest.issues.deleteComment({
    owner,
    repo,
    comment_id: commentId,
  });
}
