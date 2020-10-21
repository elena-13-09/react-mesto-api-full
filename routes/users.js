const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
  getUsers,
  getUserById,
  updateUser,
  updateAvatar,
} = require('../controllers/users');

router.get('/', getUsers);

router.get('/:userId', celebrate({
  params: Joi.object().keys({
    userId: Joi.string(),
  }),
}), getUserById);

router.patch('/me', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    about: Joi.string().min(2).max(30),
  }).unknown(true),
}), updateUser);

router.patch('/me/avatar', celebrate({
  body: Joi.object().keys({
    avatar: Joi.string().required().pattern(/^(https?:\/\/)?([a-zA-z0-9%$=?/.-]+)\.([a-zA-z0-9%$=?/.-]+)?(#)?$/),
  }).unknown(true),
}), updateAvatar);

module.exports = router;
