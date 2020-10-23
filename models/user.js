const mongoose = require('mongoose');
// Для хеширования пароля
const bcrypt = require('bcryptjs');
const isEmail = require('validator/lib/isEmail');
const AuthorizationError = require('../errors/authorization-err');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v) => isEmail(v), message: 'Неправильный формат почты',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  name: {
    type: String,
    minlength: 2,
    maxlength: 30,
    default: 'Имя',
  },
  about: {
    type: String,
    minlength: 2,
    maxlength: 30,
    default: 'Обо мне',
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1602600220542-f3b3b7f3bf1c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60',
    validate: {
      validator(v) {
        return /^(https?:\/\/)?([a-zA-z0-9%$=?/.-]+)\.([a-zA-z0-9%$=?/.-]+)?(#)?$/.test(v);
      },
      message: (props) => `${props.value} Некорректная ссылка`,
    },
  },
}, { versionKey: false });

userSchema.statics.findUserByCredentials = function (email, password) {
  // попытаемся найти пользователя по почте
  return this.findOne({ email }).select('+password')
    .then((user) => {
      // не нашёлся — отклоняем промис
      if (!user) {
        throw new AuthorizationError('Неправильные почта или пароль');
      }
      // нашёлся — сравниваем хеши
      return bcrypt.compare(password, user.password)
        .then((matched) => {
          if (!matched) {
            throw new AuthorizationError('Неправильные почта или пароль');
          }

          return user; // теперь user доступен
        });
    });
};

module.exports = mongoose.model('user', userSchema);
