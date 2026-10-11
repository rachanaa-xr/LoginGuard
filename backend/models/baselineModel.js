const eventModel = require("./eventModel");

/**
 * Baselines are not stored – they're recomputed from the event history, so
 * they can never get out of date. This model just fetches the raw history.
 */
module.exports = {
  userIds: () => eventModel.userIds().sort(),
  eventsFor: (userId, before = null) => eventModel.forUser(userId, before)
};