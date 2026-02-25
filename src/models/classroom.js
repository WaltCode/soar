const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, minlength: 2 },
  capacity: { type: Number, required: true, min: 1 },
  resources: [String]
}, { timestamps: true });

schema.index({ schoolId: 1 });

module.exports = mongoose.model('Classroom', schema);