const mongoose = require('mongoose');
const Review = mongoose.model('Review');

exports.createReview = async (req, res) => {
  const { text, rating } = req.body;
  const review = new Review({
    author: req.user._id,
    store: req.params.id,
    text,
    rating
  });
  await review.save();
  req.flash('success', 'Review Saved!');
  res.redirect('back');
};
