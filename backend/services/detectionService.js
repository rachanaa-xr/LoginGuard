/**
 * detectionService.js – the rule engine.
 * analyze() looks at one login against the user's past behaviour and returns
 * the signals that fired. processLoginEvent() is the full pipeline used by
 * both the single-event API and the CSV import.
 */
const eventModel = require("../models/eventModel");
const baselineModel = require("../models/baselineModel");
const baselineService = require("./baselineServices");
const riskScoringService = require("./riskScoringService");
const alertService = require("./alertService");
const { hourOf } = require("../utils/helpers");

const MIN = 60 * 1000;
const FAILURE_WINDOW = 15 * MIN;
const JUMP_WINDOW = 60 * MIN;

/** history = this user's events strictly before `event`, oldest first. */
function analyze(event, history) {
  const baseline = baselineService.build(history, event.user_id);
  const now = Date.parse(event.timestamp);
  const signals = [];

  const recentFailures = history.filter((h) => !h.success && now - Date.parse(h.timestamp) <= FAILURE_WINDOW).length;

  if (!event.success) {
    signals.push({ code: "FAILED_LOGIN", reason: "Failed login attempt" });
    if (recentFailures >= 2) {
      signals.push({ code: "REPEATED_FAILURES", reason: `${recentFailures + 1} failed logins within 15 minutes` });
    }
  } else if (recentFailures >= 3) {
    signals.push({ code: "SUCCESS_AFTER_FAILURES", reason: `Successful login after ${recentFailures} recent failures` });
  }

  if (baseline.learned) {
    if (!baseline.devices.includes(event.device)) {
      signals.push({ code: "NEW_DEVICE", reason: `New device: ${event.device}` });
    }
    if (!baseline.locations.includes(event.location)) {
      signals.push({ code: "NEW_LOCATION", reason: `Unfamiliar location: ${event.location}` });
    }
    if (!baseline.ips.includes(event.ip_address)) {
      signals.push({ code: "NEW_IP", reason: `New IP address: ${event.ip_address}` });
    }
    if (!baselineService.isUsualHour(baseline, hourOf(event.timestamp))) {
      signals.push({ code: "UNUSUAL_HOUR", reason: `Unusual login time (usual: ${baseline.usual_hours})` });
    }
  }

  // Location changed too fast, compared with the most recent successful login.
  const last = [...history].reverse().find((h) => h.success);
  if (last && last.location !== event.location && now - Date.parse(last.timestamp) <= JUMP_WINDOW) {
    const mins = Math.max(1, Math.round((now - Date.parse(last.timestamp)) / MIN));
    signals.push({ code: "LOCATION_JUMP", reason: `Location changed from ${last.location} to ${event.location} in ${mins} min` });
  }

  return { signals, baseline };
}

/** Score, store the event, and raise an alert if it's risky. */
function processLoginEvent(event) {
  const history = baselineModel.eventsFor(event.user_id, Date.parse(event.timestamp));
  const { signals } = analyze(event, history);
  const assessment = riskScoringService.assess(signals);

  const stored = eventModel.add({ ...event, risk_score: assessment.risk_score, severity: assessment.severity });
  const alert = assessment.shouldAlert ? alertService.create(stored, assessment) : null;
  return { event: stored, alert };
}

module.exports = { analyze, processLoginEvent };