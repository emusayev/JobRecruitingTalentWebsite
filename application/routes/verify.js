const express = require('express')
const router = express.Router()

const crypto = require('crypto')
const mySQL = require('../config/database')
const emailCredentials = require('../config/email.json')
const transporterPool = require('../config/transporter')
const printers = require('../helpers/debug/DebugAlerts')
const UserError = require('../helpers/errors/UserError')

const mailOptions = {
  from: emailCredentials.email,
  to: '',
  subject: 'Welcome to SkillSeek! Please Verify Your Email Address.',
  text: ''
}

/**
 * Send verification on user registration.
 */
router.post('/initialize', (req, res, next) => {
  const firstname = req.body.firstname
  const userId = req.body.userId
  const email = req.body.email
  const hash = crypto.randomBytes(32).toString('hex') // generate verification hash

  let expiryDate = new Date()

  expiryDate.setDate(expiryDate.getDate() + 2)
  expiryDate = `${expiryDate.getUTCFullYear()}-${Number(expiryDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${expiryDate.getUTCDate().toString().padStart(2, '0')}`

  const insertionQuery = 'INSERT INTO email_verification_hashes\
                            (hash,\
                            associated_uid,\
                            hash_expiry_date)\
                          VALUES (?, ?, ?);'
  // insert verification hash in database
  mySQL.execute(insertionQuery, [hash, userId, expiryDate])
    .then((results, fields) => {
      if (results && results[0].affectedRows === 0) {
        res.status(500)
      }

      mailOptions.to = email

      // for localhost
      // mailOptions.html = `<h3>We are glad to have you onboard, ${firstname}!</h3>\
      // <h4>You are one step away from completing registration. Click on the link below to continue:</h4>\
      // <form action = 'https://localhost/verify/${hash}' method = 'POST' enctype="application/x-www-form-urlencoded">\
      // <input type = 'submit' value = 'Verification Link' style= 'background:none; border-width: 0px; color: #00B7FF; text-decoration: underline;'/>
      // </form>\
      // <h5>This link will expire at 00:00:00 ${expiryDate} (UTC) and the registration process will have to be repeated.</h5>\
      // <h4>Sincerly,<br>The SkillSeek Team</h4>`;

      // for aws
      mailOptions.html = `<h3>We are glad to have you onboard, ${firstname}!</h3>\
        <h4>You are one step away from completing registration. Click on the link below to continue:</h4>\
        <form action = 'https://skillseek.ga/verify/' method = 'GET' enctype="application/x-www-form-urlencoded">\
        <input type = 'hidden' name = 'hash' value = ${hash}>\
        <input type = 'submit' value = 'Verification Link' style= 'background:none; border-width: 0px; color: #00B7FF; text-decoration: underline;'/>\
        </form>\
        <h4>You may also click on the following link: <a href = "https://skillseek.ga/verify/?hash=${hash}">https://skillseek.ga/verify/?hash=${hash}</a></h4>\
        <h5>This link will expire at 00:00:00 ${expiryDate} (UTC) and the registration process will have to be repeated.</h5>\
        <h4>Sincerly,<br>The SkillSeek Team</h4>`

      // send email
      return new Promise((resolve) => {
        transporterPool.sendMail(mailOptions, (err, info) => {
          if (err) {
            throw new UserError('Email could not be sent.', '/registration', 200)
          }

          printers.successPrint(`Successfully sent verification email to ${email}.`)
          resolve()
        })
      })
    })
    .then(() => {
      res.status(200).end()
    })
    .catch(err => {
      console.error(err)
      printers.errorPrint('Something went wrong with email verification.')
      res.status(500)
    })
})

/**
 * Verify account.
 */
router.get('/', (req, res, next) => {
  const hash = req.query.hash
  const query = 'SELECT\
                    hash_id,\
                    hash,\
                    associated_uid\
                  FROM\
                    email_verification_hashes\
                  WHERE hash = ?;'

  // delete the hash from the database
  const deleteHash = (row_id) => {
    return new Promise((resolve) => {
      const delQuery = 'DELETE FROM email_verification_hashes WHERE hash_id = ?;'
      mySQL.execute(delQuery, [row_id])
        .then(() => {
          resolve()
        })
    })
  }

  // change verification status of user
  const updateUserStatus = (uid) => {
    return new Promise((resolve) => {
      const updateQuery = 'UPDATE\
                            users\
                          SET verified = 1\
                          WHERE users.uid = ?;'
    
      mySQL.execute(updateQuery, [uid])
        .then(() => {
          resolve()
        })
    })
  }

  mySQL.execute(query, [hash])
    .then((results, fields) => {
      if (results && results[0].length !== 1) {
        throw new UserError('Sorry but the requested hash does not exist.', '/', 200)
      }

      // await promise then resolve
      return Promise.all([deleteHash(results[0][0].hash_id), updateUserStatus(results[0][0].associated_uid)])
    })
    .then(() => {
      printers.successPrint('User account verified!')
      req.flash('success', 'User account verified! Please login.')
      res.redirect('/login')
    })
    .catch(err => {
      if (err instanceof UserError) {
        printers.errorPrint(err.getMessage())
        req.flash('error', err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL())
      }

      next(err)
    })
})

module.exports = router
