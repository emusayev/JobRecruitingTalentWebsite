const express = require('express')
const router = express.Router()

const mySQL = require('../config/database')
const printers = require('../helpers/debug/DebugAlerts')
const PostError = require('../helpers/errors/UserError')

/**
 * Add review to student's profile. (Teachers only)
 */
router.post('/add/:userid', (req, res, next) => {
  const ratedId = req.params.userid
  const raterId = req.session.userId
  const title = req.body.title
  const rating = req.body.rating
  const review = req.body.review
  let dateRated = new Date(Date.now())

  dateRated = dateRated.getUTCFullYear() + '-' + Number(dateRated.getUTCMonth() + 1).toString() + '-' + dateRated.getUTCDate().toString().padStart(2, 0)

  const query = 'INSERT INTO SkillSeek.rating\
                  (rating,\
                  rated,\
                  rater,\
                  title,\
                  review,\
                  dateRated)\
                VALUES (?, ?, ?, ?, ?, ?);'

  //character and user validation
  const validate = () => {
    return new Promise((resolve) => {
      //if not teacher
      if (!req.session.isTeacher) {
        throw new PostError('You can not review students.', '/', 200)
      }

      if (!title || !rating || !review) {
        throw new PostError('Please fill in all requried fields.',
                            `/profile/${req.session.reqUserProfile}`,
                            200)
      }

      if (title.length > 62 || rating > 10 || rating < 0 || review.length > 4094) {
        throw new PostError('Input out of bounds. Please try again.', 
                            `/profile/${req.session.reqUserProfile}`,
                            200)
      }

      //if profile is not a student's
      if (req.session.requestedAccountType !== 'student') {
        throw new PostError('You may only review students.', `/profile/${req.session.reqUserProfile}`, 200)
      }

      return resolve()
    })
  }

  validate()
    .then(() => { 
      return mySQL.execute(query, [rating, ratedId, raterId, title, review, dateRated]) //execute query
    })
    .then((results, fields) => {
      req.flash('success', 'Rating successfully added.')
      printers.successPrint('Rating added.')
      res.redirect(`/profile/${req.session.reqUserProfile}`)
    })
    .catch(err => {
      if (err instanceof PostError) {
        req.flash('error', err.getMessage())
        printers.errorPrint(err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL())
      } else {
        next(err)
      }
    })
})

/**
 * Allow teachers to delete their own review off of student's page.
 */
router.post('/delete/:userid/:rating_id', (req, res, next) => {
  const ratingId = req.params.rating_id
  const ratedId = req.params.userid
  let ratedUsername

  let query = 'SELECT\
                users.username,\
                rating.rating_id,\
                rating.rater\
              FROM\
                SkillSeek.users \
              INNER JOIN SkillSeek.rating ON rating.rated = users.uid \
              WHERE rating.rated = ? AND rating.rating_id = ?;'
  
    mySQL.execute(query, [ratedId, ratingId]) //execute query
    .then((results, fields) => {
      
      //if review not found
      if (!results || results[0].length === 0) {
        throw new PostError('Review not found.', `/${req.session.reqUserProfile}`, 200)
      }

      ratedUsername = results[0][0].username

      //if acc type is not teacher
      if (!req.session.isTeacher) {
        throw new PostError('You cannot delete student reviews.', `/profile/${ratedUsername}`, 200)
      }

      //if rater is not deleter 
      if (results[0][0].rater !== req.session.userId) {
        throw new PostError('You cannot delete a review not made by another user.',
                            `/profile/${ratedUsername}`,
                             200)
      }

      query = 'DELETE FROM SkillSeek.rating\
                  WHERE rating.rated = ?\
                  AND rating.rating_id = ?\
                  AND rating.rater = ?;'
      return mySQL.execute(query, [ratedId, ratingId, req.session.userId]) //execute query
    })
    .then((results, fields) => {
      req.flash('success', 'Review successfully deleted.')
      printers.successPrint('Review successfully deleted.')
      res.status(303)
    })
    .catch(err => {
      if (err instanceof PostError) {
        req.flash('error', err.getMessage())
        printers.errorPrint(err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL())
      } else {
        next(err)
      }
    })
})

module.exports = router