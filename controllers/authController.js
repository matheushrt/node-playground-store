const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const crypto = require('crypto');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  console.log(req.logout);

  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash('error', 'Oops you must be logged in to do that!');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    req.flash('error', 'No account with that email exists.');
    res.redirect('/login');
    return;
  }
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: 'Password Reset',
    resetURL,
    filename: 'password-reset'
  });
  req.flash('success', 'You have been emailed a password link.');
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Password reset link is invalid or has expired');
    res.redirect('/login');
    return;
  }

  if (req.method === 'POST') {
    await user.setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash(
      'success',
      'Nice! Your password has been reset! You are now logged in!'
    );
    res.redirect('/');
  }

  res.render('reset', { title: 'Reset your password.' });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next();
    return;
  }
  req.flash('error', 'Passwords do not match!');
  res.redirect('back');
};
