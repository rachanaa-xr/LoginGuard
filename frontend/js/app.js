 
/* app.js – navigation and start-up */

const PAGES = {
  dashboard: {
    title: "Security dashboard",
    sub: "Monitor authentication activity and anomalies.",
    load: () => loadDashboard()
  },

  events: {
    title: "Login event history",
    sub: "Every recorded login attempt.",
    load: () => loadEvents()
  },

  alerts: {
    title: "Security alerts",
    sub: "Suspicious logins ranked by risk.",
    load: () => loadAlerts()
  },

  investigation: {
    title: "Alert investigation",
    sub: "Select an alert, review the evidence, and record a decision.",
    load: () => loadInvestigationPage()
  },

  baselines: {
    title: "Behavioral baselines",
    sub: "What normal looks like for each user.",
    load: () => loadBaselines()
  },

  import: {
    title: "Import login data",
    sub: "Upload a CSV of login events.",
    load: () => {}
  },
  "login-analyzer": {
    title: "Live Login Risk Analyzer",
    sub: "Evaluate login context and flag potentially suspicious activity.",
    load: () => {}
  }
};


/* Show the selected page */
function showPage(page, shouldLoad = true) {
  if (!PAGES[page] || !$(page)) {
    console.error("Page not found:", page);
    return;
  }

  document.querySelectorAll(".page").forEach(section => {
    section.classList.add("hidden");
  });

  $(page).classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  $("page-title").textContent = PAGES[page].title;
  $("page-sub").textContent = PAGES[page].sub;

  if (shouldLoad) {
    PAGES[page].load();
  }

  window.scrollTo(0, 0);
}


/* Sidebar navigation */
document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});


/* Open alerts and navigate to other pages */
document.addEventListener("click", event => {
  const alertButton = event.target.closest("[data-open-alert]");

  if (alertButton) {
    openInvestigation(alertButton.dataset.openAlert);
    return;
  }

  const navigationButton = event.target.closest("[data-goto]");

  if (navigationButton) {
    showPage(navigationButton.dataset.goto);
  }
});


/* Start the application */
(async function init() {
  showPage("dashboard");

  try {
    await API.summary();

    $("status").textContent = "● Connected";
    $("status").className = "status ok";

  } catch (error) {
    $("status").textContent = "● Server offline";
    $("status").className = "status bad";

    console.error("Server connection failed:", error);
  }
})();
