const express = require("express");
const Campsite = require("../models/campsite");
const authenticate = require("../authenticate");

const campsiteRouter = express.Router();

campsiteRouter
  .route("/")
  .get((req, res, next) => {
    Campsite.find()
      .populate("comments.author")
      .then((campsites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(campsites);
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.create(req.body)
      .then((campsite) => {
        console.log("Campsite Created ", campsite);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(campsite);
      })
      .catch((err) => next(err));
  });

campsiteRouter.route("/:campsiteId").get((req, res, next) => {
  Campsite.findById(req.params.campsiteId)
    .populate("comments.author")
    .then((campsite) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(campsite);
    })
    .catch((err) => next(err));
});

campsiteRouter
  .route("/:campsiteId/comments")
  .get((req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate("comments.author")
      .then((campsite) => {
        if (campsite) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(campsite.comments);
        } else {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .then((campsite) => {
        if (campsite) {
          req.body.author = req.user._id;
          campsite.comments.push(req.body);
          campsite
            .save()
            .then((campsite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(campsite);
            })
            .catch((err) => next(err));
        } else {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /campsites/${req.params.campsiteId}/comments`
    );
  })
  .delete(
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Campsite.findById(req.params.campsiteId)
        .then((campsite) => {
          if (campsite) {
            for (let i = campsite.comments.length - 1; i >= 0; i--) {
              campsite.comments.id(campsite.comments[i]._id).remove();
            }
            campsite
              .save()
              .then((campsite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(campsite);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(`Campsite ${req.params.campsiteId} not found`);
            err.status = 404;
            return next(err);
          }
        })
        .catch((err) => next(err));
    }
  );

  campsiteRouter.route('/:campsiteId/comments/:commentId')
  .put(authenticate.verifyUser, (req, res, next) => {
      Campsite.findById(req.params.campsiteId)
          .then(campsite => {
              if (campsite && campsite.comments.id(req.params.commentId)) {
                  const comment = campsite.comments.id(req.params.commentId);
                  if (comment.author.equals(req.user._id)) {
                      if (req.body.rating) {
                          comment.rating = req.body.rating;
                      }
                      if (req.body.text) {
                          comment.text = req.body.text;
                      }
                      campsite.save()
                          .then(campsite => {
                              res.statusCode = 200;
                              res.setHeader('Content-Type', 'application/json');
                              res.json(campsite);
                          })
                          .catch(err => next(err));
                  } else {
                      const err = new Error('You are not authorized to update this comment!');
                      err.status = 403;
                      return next(err);
                  }
              } else if (!campsite) {
                  const err = new Error(`Campsite ${req.params.campsiteId} not found`);
                  err.status = 404;
                  return next(err);
              } else {
                  const err = new Error(`Comment ${req.params.commentId} not found`);
                  err.status = 404;
                  return next(err);
              }
          })
          .catch(err => next(err));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
      Campsite.findById(req.params.campsiteId)
          .then(campsite => {
              if (campsite && campsite.comments.id(req.params.commentId)) {
                  const comment = campsite.comments.id(req.params.commentId);
                  if (comment.author.equals(req.user._id)) {
                      comment.remove();
                      campsite.save()
                          .then(campsite => {
                              res.statusCode = 200;
                              res.setHeader('Content-Type', 'application/json');
                              res.json(campsite);
                          })
                          .catch(err => next(err));
                  } else {
                      const err = new Error('You are not authorized to delete this comment!');
                      err.status = 403;
                      return next(err);
                  }
              } else if (!campsite) {
                  const err = new Error(`Campsite ${req.params.campsiteId} not found`);
                  err.status = 404;
                  return next(err);
              } else {
                  const err = new Error(`Comment ${req.params.commentId} not found`);
                  err.status = 404;
                  return next(err);
              }
          })
          .catch(err => next(err));
  });


module.exports = campsiteRouter;
