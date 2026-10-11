const { validateEvent, validateReview } = require("../utils/validators");
const { HttpError } = require("../utils/helpers");

/** Runs a validator on req.body; stores the clean result on req.valid. */
const validateBody = (validator) => (req, res, next) => {
  const { value, error } = validator(req.body);
  if (error) return next(new HttpError(400, error));
  req.valid = value;
  next();
};

module.exports = {
  validateEventBody: validateBody(validateEvent),
  validateReviewBody: validateBody(validateReview)
};