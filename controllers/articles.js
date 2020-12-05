const Article = require('../models/article');
const ForbiddenError = require('../errors/forbidden_err');

const getArticles = (req, res, next) => {
const userOwner = req.user._id;
Article.find({ owner: userOwner })

    .then((article) => res.send({ data: article }))
    .catch(next);
};

const createArticle = (req, res, next) => {
  const {
    keyword, title, text, date, source, link, image,
  } = req.body;
  Article.create({
    keyword, title, text, date, source, link, image, owner: req.user._id,
  })
    .then((article) => res.status(201).send({ data: article }))
    .catch(next);
};

const deleteArticle = (req, res, next) => {
  Article.findById(req.params.articleId)
    .select('+owner')
    .orFail()
    .then((article) => {
      const owner = article.owner._id.toString();

      if (req.user._id !== owner) {
        throw new ForbiddenError('Нельзя удалить чужую статью');
      } else {
        Article.deleteOne(article)
          .then(() => res.send({ data: 'Статья удалена' }))
          .catch(next);
      }
    })

    .catch(next);
};

module.exports = { getArticles, createArticle, deleteArticle };
