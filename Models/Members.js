const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  M_email: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model('Member', MemberSchema);
