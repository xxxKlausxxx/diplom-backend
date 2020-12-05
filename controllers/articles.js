const Article = require('../models/article');
const ForbiddenError = require('../errors/forbidden_err');

const getArticles = (req, res, next) => {
  Article.find({}).select('owner').exec(function(err, article) {
    if (article.owner === req.user._id) {
      return true
    } else {
      return false
    }
  })
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
  const articleOwner = req.user._id;
  Article.findById(req.params.articleId)
    .orFail()
    .then((article) => {
      const owner = article.owner._id.toString();

      if (articleOwner !== owner) {
        throw new ForbiddenError('Нельзя удалить чужую статью');
      } else {
        Article.deleteOne(article)
          .then(() => res.send({ data: article }))
          .catch(next);
      }
    })

    .catch(next);
};

module.exports = { getArticles, createArticle, deleteArticle };
