require('dotenv').config();
console.log(process.env.NODE_ENV);
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const auth = require('./middlewares/auth');
const { createUser, login } = require('./controllers/auth');
const NotFoundError = require('./errors/not-found-err');
const { celebrate, Joi, errors } = require('celebrate');
const { requestLogger, errorLogger } = require('./middlewares/logger');


// Слушаем 3000 порт
const { PORT = 3000 } = process.env;

const app = express();
// подключаемся к серверу mongo
mongoose.connect('mongodb://localhost:27017/mestodb', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

app.use(bodyParser.json()); // для собирания JSON-формата
app.use(bodyParser.urlencoded({ extended: true })); // для приёма веб-страниц внутри POST-запроса

// ограничение количества запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Повторите запрос позже',
});

// применить ко всем запросам
app.use(limiter);

app.use(cors());

app.use(requestLogger); // подключаем логгер запросов

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }).unknown(true),
}), login);

app.post('/signup', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    name: Joi.string().min(2).max(30),
    about: Joi.string().min(2).max(30),
    avatar: Joi.string().pattern(/^(https?:\/\/)?([a-zA-z0-9%$=?/.-]+)\.([a-zA-z0-9%$=?/.-]+)?(#)?$/),
  }).unknown(true),
}), createUser);

app.use(auth); // все роуты ниже этой строки будут защищены

app.use('/cards', require('./routes/cards'));

app.use('/users', require('./routes/users'));

app.use(errorLogger); // подключаем логгер ошибок

app.use(errors()); // обработчик ошибок celebrate

app.use((req, res, next) => {
  next(new NotFoundError('Запрашиваемый ресурс не найден'));
});

app.use((err, req, res, next) => {
  // если у ошибки нет статуса, выставляем 500
  const { statusCode = 500, message } = err;

  res.status(statusCode).send({
    // проверяем статус и выставляем сообщение в зависимости от него
    message: statusCode === 500 ? 'На сервере произошла ошибка' : message
  });
  next();
});

app.listen(PORT, () => {
  // Если всё работает, консоль покажет, какой порт приложение слушает
  console.log(`App listening on port ${PORT}`);
});


