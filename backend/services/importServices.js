/**
 * importService.js – CSV in, scored events and alerts out.
 */
const { parse } = require("csv-parse/sync");
const eventModel = require("../models/eventModel");
const detectionService = require("./detectionService");
const { validateEvent } = require("../utils/validators");
const { HttpError } = require("../utils/helpers");

const REQUIRED_COLUMNS = ["user_id", "timestamp", "ip_address", "location", "device", "success"];
const MAX_ROWS = 20000;
const MAX_ERRORS_REPORTED = 20;

function importCsv(buffer) {
  let header = [];
  let rows;
  try {
    rows = parse(buffer.toString("utf8"), {
      columns: (h) => (header = h.map((c) => String(c).trim().toLowerCase())),
      bom: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });
  } catch (err) {
    throw new HttpError(400, `This doesn't look like a valid CSV file: ${err.message}`);
  }

  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) throw new HttpError(400, `Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`);
  if (!rows.length) throw new HttpError(400, "The file has a header but no rows.");
  if (rows.length > MAX_ROWS) throw new HttpError(413, `Too many rows (${rows.length}). The limit is ${MAX_ROWS} per file.`);

  const errors = [];
  const valid = [];
  rows.forEach((raw, i) => {
    const { value, error } = validateEvent(raw);
    if (error) errors.push(`Row ${i + 2}: ${error}`);
    else valid.push(value);
  });

  // Oldest first, so each login is judged against the history that came before it.
  valid.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  let imported = 0, duplicates = 0, alerts_created = 0;
  for (const event of valid) {
    if (eventModel.exists(event)) { duplicates++; continue; }
    const { alert } = detectionService.processLoginEvent(event);
    imported++;
    if (alert) alerts_created++;
  }

  return {
    imported,
    skipped: errors.length + duplicates,
    duplicates,
    alerts_created,
    errors: errors.slice(0, MAX_ERRORS_REPORTED).concat(
      errors.length > MAX_ERRORS_REPORTED ? [`…and ${errors.length - MAX_ERRORS_REPORTED} more rows with problems`] : []
    )
  };
}

module.exports = { importCsv, REQUIRED_COLUMNS };