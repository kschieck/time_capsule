function getDayStartTime() {
  var date = new Date(new Date().toDateString());
  date.setTime(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
  return date
}

function getCurrentTime() {
  var date = new Date();
  date.setTime(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
  return date
}

module.exports = {
  getDayStartTime,
  getCurrentTime
};