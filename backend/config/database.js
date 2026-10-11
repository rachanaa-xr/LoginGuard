/**
 * database.js – tiny JSON-file database.
 *
 * Works offline, survives restarts, needs no install. Everything lives in
 * data/loginguard.json (change with DATA_FILE in .env).
 *
 * When you're ready for Supabase/PostgreSQL, this file and the four files in
 * models/ are the only places that need to change – the rest of the app
 * never touches storage directly.
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ quiet: true });

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "../../data/loginguard.json");

const fresh = () => ({
  counters: { events: 0, alerts: 1000, reviews: 0 },
  events: [],
  alerts: [],
  reviews: []
});

function load() {
  try {
    return Object.assign(fresh(), JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
  } catch {
    return fresh(); // first run, or unreadable file
  }
}

const data = load();
let timer = null;

function flush() {
  clearTimeout(timer);
  timer = null;
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, DATA_FILE); // write-then-rename so a crash can't corrupt the file
}

/** Save soon (batches many writes into one). */
function save() {
  if (timer) return;
  timer = setTimeout(flush, 300);
  timer.unref();
}

const nextId = (name) => ++data.counters[name];

process.on("exit", () => { if (timer) flush(); });
process.on("SIGINT", () => { if (timer) flush(); process.exit(0); });

module.exports = { data, save, flush, nextId, DATA_FILE };