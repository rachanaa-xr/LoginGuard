const { data, save, nextId } = require("../config/database");

module.exports = {
  all: () => data.alerts,
  findById: (id) => data.alerts.find((a) => a.id === Number(id)),

  add(alert) {
    const row = { id: nextId("alerts"), ...alert };
    data.alerts.push(row);
    save();
    return row;
  },

  update(id, fields) {
    const alert = data.alerts.find((a) => a.id === Number(id));
    if (alert) { Object.assign(alert, fields); save(); }
    return alert;
  }
};