const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const { sendRecoveryEmail } = require('../utils/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Setup first user
router.post('/setup', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(400).json({ message: 'User already set up' });
    }
    const { password, email, name } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    const user = new User({ 
      password, 
      email: email || '', 
      name: name || 'Master Nirob' 
    });
    await user.save();
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' } 
    );
    res.status(201).json({ token, isSetup: true, message: 'Master user created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Standard Master Password Login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ message: 'No user found. Please run setup.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' } 
    );
    res.json({ 
      token, 
      isSetup: true, 
      user: { email: user.email, name: user.name, googleId: !!user.googleId } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google OAuth Login & Account Binding
router.post('/google', async (req, res) => {
  try {
    const { credential, email: directEmail, name: directName, googleId: directGoogleId } = req.body;
    let googleUser = {
      email: directEmail,
      name: directName || 'Master Nirob',
      sub: directGoogleId,
      picture: ''
    };

    // If credential token from Google Identity Services is provided
    if (credential) {
      try {
        if (process.env.GOOGLE_CLIENT_ID) {
          const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          googleUser = {
            email: payload.email,
            name: payload.name || 'Master Nirob',
            sub: payload.sub,
            picture: payload.picture || ''
          };
        } else {
          // Decode payload safely without verification if CLIENT_ID not set in env yet
          const decoded = jwt.decode(credential);
          if (decoded && decoded.email) {
            googleUser = {
              email: decoded.email,
              name: decoded.name || 'Master Nirob',
              sub: decoded.sub,
              picture: decoded.picture || ''
            };
          }
        }
      } catch (verifyErr) {
        console.error('Google verification fallback:', verifyErr.message);
      }
    }

    if (!googleUser.email) {
      return res.status(400).json({ message: 'Failed to extract Google account details' });
    }

    let user = await User.findOne();
    if (!user) {
      // First time initialization with Google
      user = new User({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.sub,
        googlePicture: googleUser.picture,
        password: Math.random().toString(36).slice(-8)
      });
      await user.save();
    } else {
      // If user already has a bound email/account, strictly verify matching identity
      if (user.email && user.email.toLowerCase() !== googleUser.email.toLowerCase()) {
        return res.status(403).json({ 
          message: `Access Denied: The Google account (${googleUser.email}) is not authorized to access this financial ledger. Only ${user.email} is authorized.` 
        });
      }

      // If user has a bound googleId, ensure it matches
      if (user.googleId && googleUser.sub && user.googleId !== googleUser.sub && user.email.toLowerCase() !== googleUser.email.toLowerCase()) {
        return res.status(403).json({ 
          message: 'Access Denied: Unauthorized Google Identity.' 
        });
      }

      // Authorize and bind Google metadata
      user.email = user.email || googleUser.email;
      user.googleId = user.googleId || googleUser.sub;
      if (googleUser.picture) user.googlePicture = googleUser.picture;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      isSetup: true,
      user: { email: user.email, name: user.name, googleId: !!user.googleId }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if user setup is complete & get email hint
router.get('/check-setup', async (req, res) => {
  try {
    const user = await User.findOne();
    let maskedEmail = '';
    if (user && user.email) {
      const [local, domain] = user.email.split('@');
      maskedEmail = `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
    }
    res.json({ 
      isSetup: !!user,
      hasBoundEmail: !!(user && user.email),
      maskedEmail
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// J.A.R.V.I.S. Emergency Recovery - Request Code
router.post('/request-recovery', async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({ message: 'System uninitialized. No master profile found.' });
    }

    const targetEmail = req.body.email || user.email;
    if (!targetEmail) {
      return res.status(400).json({ 
        message: 'No recovery email bound to J.A.R.V.I.S. Please provide your master email.',
        needsEmailInput: true
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.recoveryOtp = otp;
    user.recoveryOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    if (!user.email) user.email = targetEmail;
    await user.save();

    // Send email
    const mailRes = await sendRecoveryEmail(targetEmail, otp, user.name || 'Master Nirob');

    const [local, domain] = targetEmail.split('@');
    const masked = `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;

    res.json({
      success: true,
      message: `Emergency recovery authorization dispatched to ${masked}`,
      maskedEmail: masked,
      // For instant testing if SMTP is not filled in .env
      devCode: (!process.env.SMTP_USER && !process.env.GMAIL_USER) ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// J.A.R.V.I.S. Emergency Recovery - Verify Code & Reset Password
router.post('/verify-recovery', async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) {
      return res.status(400).json({ message: 'Recovery code and new password are required' });
    }

    const user = await User.findOne();
    if (!user || !user.recoveryOtp || !user.recoveryOtpExpires) {
      return res.status(400).json({ message: 'No active recovery authorization found' });
    }

    if (new Date() > new Date(user.recoveryOtpExpires)) {
      return res.status(400).json({ message: 'Authorization code has expired. Please request a new one.' });
    }

    if (user.recoveryOtp.trim() !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid emergency authorization code. Access denied.' });
    }

    // Reset password & clear OTP
    user.password = newPassword;
    user.recoveryOtp = null;
    user.recoveryOtpExpires = null;
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      message: 'Master password successfully updated. Welcome back, Master Nirob.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User profile & binding settings
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      email: user.email,
      name: user.name,
      hasGoogleLinked: !!user.googleId,
      googlePicture: user.googlePicture
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { email, name } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (email !== undefined) user.email = email;
    if (name !== undefined) user.name = name;
    await user.save();
    res.json({ success: true, user: { email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
