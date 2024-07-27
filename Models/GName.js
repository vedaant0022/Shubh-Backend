const mongoose = require('mongoose');

const G_NameSchema = new mongoose.Schema({
  Gname: {
    type: String,
    unique: true, 
    required: true, 
  },
  Gphoto: {
    type: String
  },
  createdBy: {
    type: String, 
    required: true
  },
  photo: [{
    type: []
  }],
  members: [{
    type: String 
  }]
},{ timestamps: true });

module.exports = mongoose.model('GName', G_NameSchema);
