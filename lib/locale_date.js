module.exports = localeDate;

function localeDate() {
  const localeString = new Date().toLocaleString("en-US", { timeZone: process.env.INPUT_TIME_ZONE });
  return new Date(localeString)
}
