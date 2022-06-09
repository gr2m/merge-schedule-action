const commentHeader = "<!-- Merge Schedule Pull Request Comment -->";

/**
 * Get the previous comment on the pull request
 * @param {import("@octokit/action").Octokit} octokit 
 * @param {number} pullRequestNumber
 */
async function getPreviousComment(octokit, pullRequestNumber) {
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
        comment.body?.includes(commentHeader)
      );
    }
  );
  const previousComment = prComments.pop();
  return previousComment;
}

/**
 * Append the comment header to the body
 * @param {string} body 
 */
function bodyWithHeader(body) {
  return body.endsWith(commentHeader) ? body : `${body}\n${commentHeader}`;
}

/**
 * Create a comment on the pull request
 * @param {import("@octokit/action").Octokit} octokit 
 * @param {number} pullRequestNumber 
 * @param {string} body 
 */
async function createComment(octokit, pullRequestNumber, body) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  return octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullRequestNumber,
    body: bodyWithHeader(body),
  });
}

/**
 * Update the comment on the pull request
 * @param {import("@octokit/action").Octokit} octokit 
 * @param {number} commentId 
 * @param {string} body 
 */
async function updateComment(octokit, commentId, body) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  return octokit.rest.issues.updateComment({
    owner,
    repo,
    comment_id: commentId,
    body: bodyWithHeader(body),
  });
}

/**
 * Delete the comment on the pull request
 * @param {import("@octokit/action").Octokit} octokit 
 * @param {number} commentId 
 */
async function deleteComment(octokit, commentId) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  return octokit.rest.issues.deleteComment({
    owner,
    repo,
    comment_id: commentId,
  });
}

module.exports = {
  getPreviousComment,
  createComment,
  updateComment,
  deleteComment,
};
