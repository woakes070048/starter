var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Order = new Schema({
  body: { type: String },
  budget: { type: String },
  email: { type: String },
  domain: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', Order);
