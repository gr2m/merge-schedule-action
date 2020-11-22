module.exports = localeDate;

function localeDate() {
  const timeZone = process.env.TIME_ZONE || 'UTC'
  const localeString = new Date().toLocaleString("en-US", { timeZone });
  return new Date(localeString)
}
