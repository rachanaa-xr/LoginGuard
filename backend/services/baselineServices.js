/**
 * baselineService.js – learns what "normal" looks like for a user
 * from their past successful logins.
 */
const baselineModel = require("../models/baselineModel");
const { ALERT_THRESHOLD } = require("./riskScoringService");
const { pad2, hourOf, hourDistance, unique } = require("../utils/helpers");

const MIN_HISTORY = Number(process.env.BASELINE_MIN_EVENTS) || 3; // successful logins needed before "new device/location" rules apply
const HOUR_TOLERANCE = 2; // hours either side of a usual hour still count as normal

/** "09:00–17:59" – the shortest stretch of the day that covers all usual hours. */
function describeHours(hours) {
  const h = unique(hours).sort((a, b) => a - b);
  if (!h.length) return null;
  let bestGap = -1, endIdx = 0;
  h.forEach((v, i) => {
    const gap = h.length === 1 ? 24 : (h[(i + 1) % h.length] - v + 24) % 24;
    if (gap > bestGap) { bestGap = gap; endIdx = i; }
  });
  const start = h[(endIdx + 1) % h.length];
  const end = h[endIdx];
  return `${pad2(start)}:00–${pad2(end)}:59 UTC`;
}

/**
 * Only successful logins that weren't risky count as "normal". Otherwise an attacker's
 * first successful login would teach the system that the attack is normal.
 * An analyst marking an alert "legitimate" sets event.trusted, which brings it back in.
 */
const isTrusted = (e) => e.success && (e.trusted === true || e.risk_score == null || e.risk_score < ALERT_THRESHOLD);

/** Builds a baseline from a list of past events (oldest first). */
function build(history, userId = null) {
  const ok = history.filter(isTrusted);
  const days = new Set(history.map((e) => e.timestamp.slice(0, 10))).size;
  const hours = ok.map((e) => hourOf(e.timestamp));
  return {
    user_id: userId ?? history[0]?.user_id ?? null,
    sample_size: ok.length,
    learned: ok.length >= MIN_HISTORY,
    usual_hours: describeHours(hours),
    hours: unique(hours).sort((a, b) => a - b),
    devices: unique(ok.map((e) => e.device)),
    locations: unique(ok.map((e) => e.location)),
    ips: unique(ok.map((e) => e.ip_address)),
    avg_logins_per_day: days ? Math.round((history.length / days) * 10) / 10 : 0,
    failure_rate: history.length ? Math.round((history.filter((e) => !e.success).length / history.length) * 100) / 100 : 0
  };
}

const isUsualHour = (baseline, hour) => baseline.hours.some((h) => hourDistance(h, hour) <= HOUR_TOLERANCE);

/** Baselines for every user (the Baselines page). */
function listAll() {
  return baselineModel.userIds().map((id) => build(baselineModel.eventsFor(id), id));
}

const forUser = (userId, before = null) => build(baselineModel.eventsFor(userId, before), userId);

module.exports = { build, forUser, listAll, isUsualHour, MIN_HISTORY };