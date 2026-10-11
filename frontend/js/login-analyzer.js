/* LoginGuard - Login Risk Analyzer */
(() => {
  const form = $("loginAnalyzerForm");
  const resultBox = $("loginAnalysisResult");
  const submitButton = $("analyzeLoginBtn");

  if (!form || !resultBox || !submitButton) {
    console.error("Login Analyzer HTML elements are missing.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    resultBox.innerHTML = "";

    const failedAttempts = Number($("failedAttempts").value);
    const loginHour = Number($("loginHour").value);
    const deviceKnown = $("deviceKnown").value === "true";
    const unusualLocation =
      $("unusualLocation").value === "true";

    if (
      !Number.isInteger(failedAttempts) ||
      failedAttempts < 0 ||
      failedAttempts > 100
    ) {
      resultBox.textContent =
        "Failed attempts must be between 0 and 100.";
      return;
    }

    if (
      !Number.isInteger(loginHour) ||
      loginHour < 0 ||
      loginHour > 23
    ) {
      resultBox.textContent =
        "Login hour must be between 0 and 23.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Analyzing...";

    try {
      const analysis = await API.analyzeLogin({
        deviceKnown,
        unusualLocation,
        failedAttempts,
        loginHour
      });

      const reasons = Array.isArray(analysis.reasons)
        ? analysis.reasons
        : [];

      resultBox.replaceChildren();

      const heading = document.createElement("h3");
      heading.textContent =
        analysis.status === "SUSPICIOUS"
          ? "Suspicious login context"
          : "Low-risk login context";

      const score = document.createElement("p");
      score.textContent =
        `Risk score: ${analysis.riskScore} / 100`;

      const status = document.createElement("p");
      status.textContent = `Status: ${analysis.status}`;

      const reasonHeading = document.createElement("p");
      reasonHeading.textContent = "Risk indicators:";

      const list = document.createElement("ul");
      reasons.forEach((reason) => {
        const item = document.createElement("li");
        item.textContent = reason;
        list.appendChild(item);
      });

      const recommendation = document.createElement("p");
      recommendation.textContent =
        `Recommendation: ${analysis.recommendation}`;

      resultBox.append(
        heading,
        score,
        status,
        reasonHeading,
        list,
        recommendation
      );
    } catch (error) {
      resultBox.textContent =
        `Analysis failed: ${error.message}`;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Analyze Login";
    }
  });
})();