const { data, save, nextId } = require("../config/database");
const { HttpError } = require("../utils/helpers");

const MAX_EVENTS = Number(process.env.MAX_EVENTS) || 50000;

// In-memory indexes (rebuilt on start) so lookups stay fast during big imports.
const byUser = new Map();
const keys = new Set();
const keyOf = (e) => `${e.user_id}|${e.timestamp}|${e.ip_address}`;

for (const e of data.events) index(e);

function index(e) {
  if (!byUser.has(e.user_id)) byUser.set(e.user_id, []);
  byUser.get(e.user_id).push(e);
  keys.add(keyOf(e));
}

module.exports = {
  all: () => data.events,
  count: () => data.events.length,
  findById: (id) => data.events.find((e) => e.id === Number(id)),
  exists: (e) => keys.has(keyOf(e)),
  userIds: () => [...byUser.keys()],

  /** A user's events, oldest first. If `before` (ms) is given, only earlier events. */
  forUser(userId, before = null) {
    const list = byUser.get(userId) || [];
    const rows = before == null ? list : list.filter((e) => Date.parse(e.timestamp) < before);
    return rows.slice().sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  },

  update(id, fields) {
    const e = data.events.find((x) => x.id === Number(id));
    if (e) { Object.assign(e, fields); save(); }
    return e;
  },

  add(event) {
    if (data.events.length >= MAX_EVENTS) throw new HttpError(507, `Storage limit of ${MAX_EVENTS} events reached.`);
    const row = { id: nextId("events"), ...event };
    data.events.push(row);
    index(row);
    save();
    return row;
  }
};