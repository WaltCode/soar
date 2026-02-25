const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const schema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, minlength: 3 },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'schooladmin'], required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  refreshToken: String
}, { timestamps: true });

schema.pre('save', async function() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});

schema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', schema);