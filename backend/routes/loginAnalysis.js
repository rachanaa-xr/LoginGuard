 const express = require("express");
const router = express.Router();

const {
  analyzeLogin
} = require("../services/loginAnalysisService");

router.post("/analyze", (req, res) => {
  const {
    deviceKnown,
    unusualLocation,
    failedAttempts,
    loginHour
  } = req.body || {};

  if (
    typeof deviceKnown !== "boolean" ||
    typeof unusualLocation !== "boolean" ||
    !Number.isInteger(failedAttempts) ||
    failedAttempts < 0 ||
    failedAttempts > 100 ||
    !Number.isInteger(loginHour) ||
    loginHour < 0 ||
    loginHour > 23
  ) {
    return res.status(400).json({
      error: "Invalid login risk information."
    });
  }

  const result = analyzeLogin({
    deviceKnown,
    unusualLocation,
    failedAttempts,
    loginHour
  });

  return res.json(result);
});

module.exports = router;