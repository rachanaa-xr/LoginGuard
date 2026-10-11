const { data, save, nextId } = require("../config/database");

/** Audit trail of every analyst decision (who/what/when stays after refresh). */
module.exports = {
  add(review) {
    const row = { id: nextId("reviews"), ...review, reviewed_at: new Date().toISOString() };
    data.reviews.push(row);
    save();
    return row;
  },
  forAlert: (alertId) => data.reviews.filter((r) => r.alert_id === Number(alertId))
};