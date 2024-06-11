const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\d{10}$/, 'Please enter a valid phone number']
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GName'
  }]
  
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
