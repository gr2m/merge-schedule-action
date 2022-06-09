/**
 * Check if the given string is a schedule command.
 * @param {string} text The text to check.
 */
function hasScheduleCommand(text) {
  return /(^|\n)\/schedule /.test(text);
}

/**
 * Get the date string from the schedule command.
 * @param {string} text The text to match.
 */
function getScheduleDateString(text) {
  return text.match(/(^|\n)\/schedule (.*)/).pop();
}

/**
 * Check if the given string is a valid date.
 * @reference https://stackoverflow.com/a/1353711/206879
 */
function isValidDate(datestring) {
  const date = new Date(datestring);
  return date instanceof Date && !Number.isNaN(date);
}

/**
 * Check if pull request is a fork.
 * @param {*} pullRequest 
 */
function isFork(pullRequest) {
  return Boolean(pullRequest.head.repo.fork);
}

module.exports = {
  hasScheduleCommand,
  getScheduleDateString,
  isFork,
  isValidDate,
}
