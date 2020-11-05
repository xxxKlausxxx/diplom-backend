const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { celebrate, Joi, errors } = require('celebrate');
const rateLimit = require('express-rate-limit');
const articlesRouter = require('./routes/articles');
const usersRouter = require('./routes/users');
const auth = require('./middlewares/auth');
const { login, createUser } = require('./controllers/users');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const RequestError = require('./errors/req_err');

const { PORT = 3000 } = process.env;
const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(limiter);
app.use(requestLogger);

mongoose.connect('mongodb://localhost:27017/mestodb', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
});
mongoose.set('runValidators', true);

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().pattern(/^([\w-]\.?)+@([\w-]+\.)+[\w-]+/),
    password: Joi.string().min(6).pattern(/\S+/),
  }),
}), login);
app.post('/signup',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(30),
      email: Joi.string().required().pattern(/^([\w-]\.?)+@([\w-]+\.)+[\w-]+/),
      password: Joi.string().min(8).pattern(/\S+/),
    }),
  }),
  createUser);

app.use(auth);

app.use('/', usersRouter);
app.use('/', articlesRouter);
app.use('*', () => {
  throw new RequestError('Запрашиваемый ресурс не найден');
});
app.use(errorLogger);
app.use(errors());

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;

  if (err.name === 'ValidationError') {
    return res.status(400).send('Ошибка валидации поля');
  }
  if (err.name === 'CastError') {
    return res.status(400).send({ message: 'Некорректный ID' });
  }
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).send({ message: 'Такая почта уже зарегистрирована' });
  }
  return res.status(statusCode).send({ message: statusCode === 500 ? 'На сервере произошла ошибк' : message });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`App listening on port ${PORT}`);
});
