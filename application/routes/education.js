const express = require('express')
const router = express.Router()

const mySQL = require('../config/database')
const printers = require('../helpers/debug/DebugAlerts')
const PostError = require('../helpers/errors/PostError')

/**
 * Add educational background information to profile page.
 */
router.post('/add', (req, res, next) => {
  const university = req.body.university
  const degreeName = req.body.degreeName
  const degreeType = req.body.degreeType
  const startDate = req.body.beginDate
  const endDate = req.body.endDate
  let onGoing = req.body.ongoing

  // character validation and html tampering check
  const validate = () => {
    return new Promise((resolve) => {
      if (!university || !degreeName || !degreeType || !startDate) {
        throw new PostError('Please fill all required information fields before sumbitting.', '/profile', 200)
      }

      if (onGoing === 'off' && !endDate) {
        throw new PostError('Please specify whether if this experience is ongoing or state an end date.', '/profile', 200)
      }

      if (university.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in university field.', '/profile', 200)
      }

      if (degreeName.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in degree field.', '/profile', 200)
      }

      if (degreeType.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in degree type field.', '/profile', 200)
      }
      resolve()
    })
  }
  let query

  // insert education data in education table
  const insert = () => {
    if (onGoing === 'on') {
      onGoing = 1
      query = 'INSERT INTO SkillSeek.education (fk_uid, degree_type, degree_name, university, beginDate, onGoing) VALUES \
                        (?, ?, ?, ?, ?, ?);'

      return mySQL.execute(query, [req.session.userId, degreeType, degreeName, university, startDate, onGoing])
    } else {
      onGoing = 0
      query = 'INSERT INTO SkillSeek.education (fk_uid, degree_type, degree_name, university, beginDate, endDate, onGoing) VALUES \
                    (?, ?, ?, ?, ?, ?, ?);'

      return mySQL.execute(query, [req.session.userId, degreeType, degreeName, university, startDate, endDate, onGoing])
    }
  }

  validate()
    .then(() => insert())
    .then((results, fields) => {
      if (!results || results[0].length === 0) {
        throw new PostError('Invalid input detected. Please try again.', '/profile', 200)
      }

      req.flash('success', 'Educational experience successfully added.')
      printers.successPrint('Educational experience added.')
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
 * Delete a specific education entry from profile.
 */
router.post('/delete/:userid/:education_id', (req, res, next) => {
  const userId = req.params.userid
  const educationId = req.params.education_id

  if (userId !== req.session.userId) {
    throw new PostError('Cannot add education to a different user\'s profile.', '/profile', 200)
  }

  const query = 'DELETE FROM SkillSeek.education WHERE education.fk_uid = ? AND education.education_id = ?;'
  mySQL.execute(query, [userId, educationId])
    .then((results, fields) => {
      printers.successPrint('Educational experience deleted.')
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

module.exports = router
