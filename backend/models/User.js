const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  password: { type: String, default: '' },
  email: { type: String, default: '' },
  name: { type: String, default: 'Master Nirob' },
  googleId: { type: String, default: '' },
  googlePicture: { type: String, default: '' },
  recoveryOtp: { type: String, default: null },
  recoveryOtpExpires: { type: Date, default: null },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
