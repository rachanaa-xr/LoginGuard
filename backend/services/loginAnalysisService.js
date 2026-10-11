 function analyzeLogin({
  deviceKnown,
  unusualLocation,
  failedAttempts,
  loginHour
}) {
  let riskScore = 0;
  const reasons = [];

  if (!deviceKnown) {
    riskScore += 30;
    reasons.push("Unrecognized device");
  }

  if (unusualLocation) {
    riskScore += 30;
    reasons.push("Unusual login location");
  }

  if (failedAttempts >= 5) {
    riskScore += 40;
    reasons.push("Five or more failed login attempts");
  } else if (failedAttempts >= 3) {
    riskScore += 20;
    reasons.push("Multiple failed login attempts");
  }

  if (loginHour < 5 || loginHour >= 23) {
    riskScore += 10;
    reasons.push("Unusual login hour");
  }

  riskScore = Math.min(riskScore, 100);

  return {
    riskScore,
    status: riskScore >= 40 ? "SUSPICIOUS" : "LOW_RISK",
    reasons,
    recommendation: riskScore >= 40
      ? "Verify identity before allowing access."
      : "Continue with normal authentication."
  };
}

module.exports = { analyzeLogin };