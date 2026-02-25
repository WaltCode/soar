const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  name: { type: String, required: true, minlength: 2 },
  age: { type: Number, min: 5 },
  enrollmentDate: Date,
  profile: {
    photo: { type: String, match: /^https?:\/\/.+/ },
    bio: String
  }
}, { timestamps: true });

schema.index({ schoolId: 1, classroomId: 1 });

module.exports = mongoose.model('Student', schema);