const mongoose = require('mongoose');
const User = mongoose.model('User');

exports.loginForm = async (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = async (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'The Email is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password cannot be blank!').notEmpty();
  req
    .checkBody('password-confirm', 'Oops! Your passwords do not match!')
    .equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash(
      'error',
      errors.map(err => err.msg)
    );
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash()
    });
    return;
  }
  next();
};

exports.register = async (req, res, next) => {
  const { email, name, password } = req.body;
  const user = new User({ email, name });
  await User.register(user, password);
  next();
};

exports.account = (req, res) => {
  res.render('account', { title: 'Edit your Account' });
};

exports.updateAccount = async (req, res) => {
  const { name, email } = req.body;
  await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: { name, email } },
    { new: true, runValidators: true, context: 'query' }
  );
  req.flash('success', 'Updated the profile!');
  res.redirect('back');
};
