const mongoose = require('mongoose');

const initiativeSchema = new mongoose.Schema({
  legislature: String,
  initiativeId: String,
  topology: String,
  supertype: String,
  type: String,
  subtype: String,
  subsubtype: String,
  title: String,
  startDate: String,
  endDate: String,
  author: String,
  result: String,
  url: String,
});

let Initiative;
try {
  Initiative = mongoose.model('Initiative');
} catch (error) {
  Initiative = mongoose.model('Initiative', initiativeSchema);
}

module.exports = Initiative;
