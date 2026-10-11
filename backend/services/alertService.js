const alertModel = require("../models/alertModel");
const eventModel = require("../models/eventModel");

/** Creates an alert for a risky event. created_at is the time of the login. */
function create(event, assessment) {
  return alertModel.add({
    event_id: event.id,
    user_id: event.user_id,
    risk_score: assessment.risk_score,
    severity: assessment.severity,
    reasons: assessment.reasons,
    status: "open",
    location: event.location,
    created_at: event.timestamp
  });
}

/** Newest first. Optional filters: severity, status. */
function list({ severity, status } = {}) {
  return alertModel.all()
    .filter((a) => (!severity || a.severity === severity) && (!status || a.status === status))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

/** Numbers and recent alerts for the dashboard. */
function summary() {
  const alerts = alertModel.all();
  const count = (fn) => alerts.filter(fn).length;
  return {
    total_events: eventModel.count(),
    total_alerts: alerts.length,
    high_risk: count((a) => a.severity === "high"),
    pending_reviews: count((a) => a.status === "open" || a.status === "needs_review"),
    severity: {
      high: count((a) => a.severity === "high"),
      medium: count((a) => a.severity === "medium"),
      low: count((a) => a.severity === "low")
    },
    recent_alerts: list().slice(0, 5)
  };
}

module.exports = { create, list, summary };