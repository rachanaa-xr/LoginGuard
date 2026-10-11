const importService = require("../services/importServices");
const { HttpError } = require("../utils/helpers");

/** POST /api/events/import  (multipart, field "file") */
function importCsv(req, res) {
  if (!req.file) throw new HttpError(400, 'No file received. Upload a .csv in the "file" field.');
  res.status(201).json(importService.importCsv(req.file.buffer));
}

module.exports = { importCsv };