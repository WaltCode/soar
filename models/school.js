const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3 },
  address: String,
  contactEmail: { type: String, match: /^\S+@\S+\.\S+$/ },
  phone: { type: String, match: /^\+?[\d\s-]{7,15}$/ },
  profile: {
    logo: { type: String, match: /^https?:\/\/.+/ },
    description: String
  }
}, { timestamps: true });

schema.index({ name: 1 });

module.exports = mongoose.model('School', schema);