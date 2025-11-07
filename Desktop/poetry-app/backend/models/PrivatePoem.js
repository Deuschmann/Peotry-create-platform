const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrivatePoemSchema = new Schema({
  title: {
    type: String,
    default: '无题',
  },
  content: {
    type: String,
    default: '',
  },
  authorNickname: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

PrivatePoemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PrivatePoem', PrivatePoemSchema);