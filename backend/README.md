# LoginGuard – suspicious login behaviour detection

Express backend + HTML/CSS/JS frontend. It learns each user's normal login pattern, scores new logins from 0–100, explains *why* a login looks risky, and lets an analyst record a decision.

Runs fully offline. Data is saved to `data/loginguard.json`.

## Run it

```
npm install
npm run dev        (auto-restarts on changes)   or   npm start
```

Open http://localhost:3000, go to **Import data**, and upload `data/samples/sample_logins.csv`.
You should get 189 events and 9 alerts.

> Windows: if PowerShell blocks `npm`, use a **Command Prompt** terminal in VS Code.

```
npm test           (23 tests: detection rules, validation, API, import, review)
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Is the server up? |
| GET | `/api/dashboard/summary` | Totals, severity counts, 5 most recent alerts |
| GET | `/api/events` | Login events, newest first (`?limit=`) |
| POST | `/api/events` | Score one login (JSON, see below) |
| POST | `/api/events/import` | Upload a CSV (multipart field `file`, max 5 MB) |
| GET | `/api/alerts` | Alerts, newest first (`?severity=high&status=open`) |
| GET | `/api/alerts/:id` | Alert + the login + baseline at that moment + related events |
| PATCH | `/api/alerts/:id/review` | `{ "decision": "legitimate" \| "suspicious" \| "needs_review", "note": "" }` |
| GET | `/api/alerts/:id/history` | Audit trail of decisions |
| GET | `/api/baselines` / `/api/baselines/:userId` | Learned normal behaviour |

Event / CSV columns: `user_id, timestamp, ip_address, location, device, success`

```
curl -X POST http://localhost:3000/api/events -H "Content-Type: application/json" ^
  -d "{\"user_id\":\"user101\",\"timestamp\":\"2026-10-10T02:30:00Z\",\"ip_address\":\"203.0.113.20\",\"location\":\"Pune\",\"device\":\"Unknown-Laptop\",\"success\":false}"
```

## How detection works

A user needs 3 normal successful logins (`BASELINE_MIN_EVENTS`) before "new device / location / IP / hour" rules apply. Each rule that fires adds points (tune them in `backend/services/riskScoringService.js`):

| Signal | Points |
|---|---|
| Failed login | 10 |
| 3+ failures within 15 minutes | 40 |
| Success right after 3+ failures | 45 |
| New device | 25 |
| New location | 25 |
| New IP address | 10 |
| Unusual login hour (more than 2 h from usual) | 20 |
| Location changed within 60 minutes | 30 |

Score is capped at 100. **30+** raises an alert: 30–49 low, 50–69 medium, 70+ high.

Risky logins are kept out of a user's baseline, so an attacker's first successful login doesn't become "normal". Marking an alert **legitimate** adds that login to the baseline.

Hours are UTC so results are the same on every machine.

## Where things live

`routes/` URLs → `controllers/` request/response → `services/` logic → `models/` storage (`config/database.js`).
To move to Supabase/PostgreSQL, only `config/database.js` and the four files in `models/` change.

## Before real use

Auth is a single optional API key (`API_KEY` in `.env`); there are no user accounts. Storage is a JSON file. Use only synthetic data, never real credentials.