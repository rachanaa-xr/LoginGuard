/**
 * riskScoringService.js – turns detected signals into a 0-100 score.
 * All the numbers live here so you can tune them in one place.
 */
const WEIGHTS = {
  FAILED_LOGIN: 10,
  REPEATED_FAILURES: 40,       // 3+ failures in 15 minutes
  SUCCESS_AFTER_FAILURES: 45,  // login finally works after a burst of failures
  NEW_DEVICE: 25,
  NEW_LOCATION: 25,
  NEW_IP: 10,
  UNUSUAL_HOUR: 20,
  LOCATION_JUMP: 30            // location changes within an hour
};

const ALERT_THRESHOLD = 30;
const HIGH_AT = 70;
const MEDIUM_AT = 50;

const severityFor = (score) => (score >= HIGH_AT ? "high" : score >= MEDIUM_AT ? "medium" : "low");

/** signals: [{ code, reason }] -> { risk_score, severity, reasons, shouldAlert } */
function assess(signals) {
  const total = signals.reduce((sum, s) => sum + (WEIGHTS[s.code] || 0), 0);
  const risk_score = Math.min(100, total);
  return {
    risk_score,
    severity: severityFor(risk_score),
    reasons: signals.map((s) => s.reason),
    shouldAlert: risk_score >= ALERT_THRESHOLD
  };
}

module.exports = { WEIGHTS, ALERT_THRESHOLD, severityFor, assess };