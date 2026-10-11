 async function loadInvestigationPage() {
  const box = $("investigationContent");

  box.innerHTML = `
    <article class="card">
      <h2>Select an alert to investigate</h2>
      <p>Choose an alert below to review its login activity.</p>
      <p>Loading alerts...</p>
    </article>
  `;

  try {
    const alerts = await API.alerts();

    if (!alerts.length) {
      box.innerHTML = `
        <article class="card">
          <h2>No alerts available</h2>
          <p>Import login data to generate alerts for investigation.</p>
          <button class="primary" data-goto="import">
            Import login data
          </button>
          <button class="btn" data-goto="alerts">
            View alerts
          </button>
        </article>
      `;
      return;
    }

    box.innerHTML = `
      <article class="card">
        <h2>Choose an alert</h2>
        <p>Click an alert to investigate it.</p>
        <div id="investigationAlertList"></div>
      </article>
    `;

    $("investigationAlertList").innerHTML = alerts
      .sort((a, b) => b.risk_score - a.risk_score)
      .map(alertRow)
      .join("");

  } catch (error) {
    showError(box, error, loadInvestigationPage);
  }
}


function openInvestigation(id) {
  showPage("investigation", false);
  loadInvestigation(id);
}