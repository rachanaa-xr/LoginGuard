const alertModel = require("../models/alertModel");
const eventModel = require("../models/eventModel");
const investigationModel = require("../models/investigationModel");
const baselineService = require("./baselineServices");
const { HttpError } = require("../utils/helpers");

function getAlertOr404(id) {
  const alert = alertModel.findById(id);
  if (!alert) throw new HttpError(404, "Alert not found");
  return alert;
}

/** Everything an analyst needs on one screen. */
function getDetail(id) {
  const alert = getAlertOr404(id);
  const event = eventModel.findById(alert.event_id) || null;
  const before = event ? Date.parse(event.timestamp) : null;
  const baseline = baselineService.forUser(alert.user_id, before); // what was "normal" at that moment
  const related = eventModel.forUser(alert.user_id).slice(-10).reverse();
  return { ...alert, event, baseline, related_events: related, reviews: investigationModel.forAlert(alert.id) };
}

/** Saves the analyst's decision and keeps an audit record. */
function review(id, { decision, note }) {
  const alert = getAlertOr404(id);
  investigationModel.add({ alert_id: alert.id, decision, note, previous_status: alert.status });
  // Feedback loop: "legitimate" teaches the baseline; "suspicious" keeps the login out of it.
  if (decision === "legitimate") eventModel.update(alert.event_id, { trusted: true });
  if (decision === "suspicious") eventModel.update(alert.event_id, { trusted: false });
  return alertModel.update(alert.id, { status: decision });
}

const history = (id) => investigationModel.forAlert(getAlertOr404(id).id);

module.exports = { getDetail, review, history };