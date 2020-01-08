const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter: (req, file, next) => {
    const isPhoto = () => !!file.mimetype.startsWith === 'image/';
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype is not allowed!' }, false);
    }
  }
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', {
    title: 'Add Store'
  });
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  req.flash(
    'success',
    `Successfully Created ${store.name}. Care to leave a review?`
  );
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const page = Number(req.params.page) || 1;
  const limit = 6;
  const skip = page * limit - limit;
  const storesPromise = Store.find()
    .skip(skip)
    .limit(limit);
  const storesCountPromise = Store.count();
  const [stores, count] = await Promise.all([
    storesPromise,
    storesCountPromise
  ]);
  const pages = Math.ceil(count / limit);

  if (page > pages || page < 1) {
    req.flash('info', 'This page does not exists.');
    res.redirect('..');
    return;
  }

  res.render('stores', { title: 'Stores', stores, page, pages, count });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own the store in order to edit it!');
  }
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  confirmOwner(store, req.user);

  res.render('editStore', {
    title: `Edit ${store.name}`,
    store
  });
};

exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true
  }).exec();
  req.flash(
    'success',
    `Successfully updated <strong>${store.name}</strong>. <a href="/store/${store.slug}">View Store</a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  if (!req.file) {
    next();
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;

  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
};

exports.getBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate(
    'author reviews'
  );
  if (!store) {
    next();
    return;
  }
  res.render('store', { title: store.name, store });
};

exports.getStoreByTag = async (req, res) => {
  const { tag } = req.params;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render('tags', { tags, title: 'Tags', tag, stores });
};

exports.searchStores = async (req, res) => {
  const stores = await Store.find(
    {
      $text: {
        $search: req.query.q
      }
    },
    // shows a new field in the document "score"
    {
      score: { $meta: 'textScore' }
    }
  )
    // sort by best text match score
    .sort({
      score: { $meta: 'textScore' }
    })
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const mongoQuery = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000
      }
    }
  };

  const stores = await Store.find(mongoQuery)
    .select('slug name description location photo')
    .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
  const { favorites, _id } = req.user;
  const favoritesToString = favorites.map(fav => fav.toString());
  const operator = favoritesToString.includes(req.params.id)
    ? '$pull'
    : '$addToSet';
  const user = await User.findByIdAndUpdate(
    _id,
    {
      [operator]: { favorites: req.params.id }
    },
    { new: true }
  );
  res.json(user);
};

exports.favoriteStores = async (req, res) => {
  const user = await User.findById(req.user._id).populate('favorites');
  res.render('stores', { title: 'Favorite Stores', stores: user.favorites });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopRatedStores();

  res.render('topStores', { stores });
};
