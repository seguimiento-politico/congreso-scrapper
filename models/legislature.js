const mongoose = require('mongoose');

const legislatureSchema = new mongoose.Schema({
  legislature: String,
  startDate: String,
  endDate: String,
});

let Legislature;
try {
  Legislature = mongoose.model('Legislature');
} catch (error) {
  Legislature = mongoose.model('Legislature', legislatureSchema);
}

module.exports = Legislature;