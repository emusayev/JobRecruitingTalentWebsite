const express = require('express')
const router = express.Router()

const mySQL = require('../config/database')
const printers = require('../helpers/debug/DebugAlerts')
const PostError = require('../helpers/errors/PostError')

/**
 * Add work experience to profile.
 */
router.post('/add', (req, res, next) => {
  const experience = req.body.experience
  const employer = req.body.employer
  const description = req.body.description
  const startDate = req.body.beginDate
  const endDate = req.body.endDate
  let onGoing = req.body.ongoing

  // charcater validation and html tampering check
  const validate = () => {
    return new Promise((resolve) => {
      if (!experience || !employer || !description || !startDate) {
        throw new PostError('Please fill all required information fields before sumbitting.', '/profile', 200)
      }

      if (onGoing === 'off' && !endDate) {
        throw new PostError('Please specify whether if this experience is ongoing or state an end date.', '/profile', 200)
      }

      if (experience.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in experience field.', '/profile', 200)
      }

      if (employer.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in employer field.', '/profile', 200)
      }

      if (description.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in description field.', '/profile', 200)
      }
      return resolve()
    })
  }

  let query
  // insert experience into experience table
  const insert = async () => {
    if (onGoing === 'on') {
      onGoing = 1
      query = 'INSERT INTO SkillSeek.experience (fk_uid, experience, employer, description, beginDate, onGoing) VALUES \
                    (?, ?, ?, ?, ?, ?);'

      return mySQL.execute(query, [req.session.userId, experience, employer, description, startDate, onGoing])
    } else {
      onGoing = 0
      query = 'INSERT INTO SkillSeek.experience (fk_uid, experience, employer, description, beginDate, endDate, onGoing) VALUES \
                    (?, ?, ?, ?, ?, ?, ?);'

      return mySQL.execute(query, [req.session.userId, experience, employer, description, startDate, endDate, onGoing])
    }
  }

  validate()
    .then(() => insert())
    .then((results, fields) => {
      if (!results || results[0].length === 0) {
        throw new PostError('Invalid input detected. Please try again.', '/profile', 200)
      }

      req.flash('success', 'Experience successfully added.')
      printers.successPrint('Experience added.')
      res.redirect('/profile')
    })
    .catch(err => {
      if (err instanceof PostError) {
        printers.errorPrint(err.getMessage())
        req.flash('error', err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL())
      } else {
        next(err)
      }
    })
})

/**
 * Delete specific work experience from profile.
 */
router.post('/delete/:userid/:experienceid', (req, res, next) => {
  const uid = req.params.userid
  const experienceId = req.params.experienceid

  if (uid !== req.session.userId) {
    throw new PostError('Cannot add experience to a different user\'s profile.', '/profile', 200)
  }

  const query = 'DELETE FROM SkillSeek.experience WHERE experience.fk_uid = ? AND experience.experience_id = ?;'
  mySQL.execute(query, [uid, experienceId])
    .then((results, fields) => {
      req.flash('success', 'Experience deleted.')
      printers.successPrint('Experience deleted.')
      res.redirect('/profile', 303)
    })
    .catch(err => {
      if (err instanceof PostError) {
        printers.errorPrint(err.getMessage())
        req.flash('error', err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL())
      } else {
        next(err)
      }
    })
})

module.exports = router
