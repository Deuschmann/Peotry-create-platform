const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PoetryNodeSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  children: [{
    type: Schema.Types.ObjectId,
    ref: 'PoetryNode'
  }],
  isRoot: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PoetryNode', PoetryNodeSchema);