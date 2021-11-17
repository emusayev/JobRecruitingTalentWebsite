const express = require('express')
const router = express.Router()

const mySQL = require('../config/database')
const transporterPool = require('../config/transporter')

const emailCredentials = require('../config/email.json')
const printers = require('../helpers/debug/DebugAlerts')
const UserError = require('../helpers/errors/UserError')
const routeProtectors = require('../middleware/route_protectors')

const crypto = require('crypto')
const cryptoJS = require('crypto-js')

const mailOptions = {
  from: emailCredentials.email,
  to: '',
  subject: 'Recover your SkillSeek account.',
  text: ''
}

/**
 * Render account recovery page.
 * Contains form to submit email and username.
 */
router.get('/', routeProtectors.allowUnloggedUser, (req, res, next) => {
  res.render('recovery', { title: 'Recover Account' })
})

/**
 * Generate recovery hash and insert into database.
 * Sends recovery hash to email address to ensure account belongs to user.
 */
router.post('/reset', routeProtectors.allowUnloggedUser, (req, res, next) => {
  const username = req.body.username
  const email = req.body.email
  const hash = crypto.randomBytes(32).toString('hex') // generate recovery hash

  let uid
  let firstname
  let expiryDate
  let reqMade = false // recovery request already

  // character validation
  const validate = () => {
    return new Promise((resolve) => {

    // check for out of bounds usernames and invalid characters
      if (!username || username.length > 62 || 
      username.search(/[\x2C]|[\x2E-\x2F]|[\x3A-\x40]|[\x5B-\x5E]|[\x60]|[\x7B-\x7F]/) !== -1) {
        throw new UserError('Invalid username.', '/recovery', 200)
      }

      if (!email && email.search(/\\/) !== -1) {
        throw new UserError('Invalid email address.', '/recovery', 200)
      }

      resolve()
    })
  }

  // account validation
  const accountValidate = () => {
    const checkAccountQuery = 'SELECT\
                                  uid,\
                                  username,\
                                  email,\
                                  firstname\
                                FROM\
                                  SkillSeek.users\
                                WHERE username = ? AND email = ?;'

    const promise = mySQL.execute(checkAccountQuery, [username, email])
      .then((results, fields) => {
        const checkForExistingRecoveryRequest = 'SELECT\
                                                  hash_id\
                                                FROM\
                                                  SkillSeek.account_recovery_hashes\
                                                WHERE associated_uid = ?;'

        // if account exists resolve
        if (results && results[0].length === 1) {
          firstname = results[0][0].firstName
          uid = results[0][0].uid

          //check if recovery request submitted
          return mySQL.execute(checkForExistingRecoveryRequest, [uid])
        }

        return Promise.reject(new UserError('Could not find an account associated with given credentials.',
                                            '/recovery', 
                                            200))
      })
      .then((results, fields) => {
        // if recovery request has already been made
        if (results && results[0].length > 0) {
          reqMade = true
          return Promise.reject(new UserError('Recovery request already made. Please check your email.',
                                              '/recovery',
                                              200))
        }

        return Promise.resolve()
      })

    return Promise.all([promise])
  }

  // send email with recovery hash to user
  const sendRecoveryEmail = () => {
    if (!firstname) {
      firstname = username
    }

    expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 2) // add two days

    // format date
    expiryDate = `${expiryDate.getUTCFullYear()}-${Number(expiryDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${expiryDate.getUTCDate().toString().padStart(2, '0')}`

    mailOptions.to = email // set recipient
    
    //set email html
    mailOptions.html = `<h3>Greetings, ${firstname}!</h3>\
        <h4>You are receiving this email because an account recovery request has been intiated. Use the button or link below to recover your account.</h4>\
        <form action = 'https://skillseek.ga/recovery/credentials' method = 'GET' enctype="application/x-www-form-urlencoded">\
        <input type = 'hidden' name = 'hash' value = ${hash}>\
        <input type = 'submit' value = 'Recover' style= 'background:none; border-width: 0px; color: #00B7FF; text-decoration: underline;'/>\
        </form>\
        <h4>You use the following link: <a href = "https://skillseek.ga/recovery/credentials/?hash=${hash}">https://skillseek.ga/recovery/crednetials/?hash=${hash}</a></h4>\
        <h4>If you have not initiated this request, please ignore this email.<h4>\
        <h5>This link will expire at 00:00:00 ${expiryDate} (UTC) and the recovery process will have to be repeated.</h5>\
        <h4>Sincerly,<br>The SkillSeek Team</h4>`

    // send email and resolve promise when successful
    return new Promise((resolve) => {
      transporterPool.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error(err)
          throw new UserError('Email could not be sent.', '/recovery', 200)
        }

        printers.successPrint(`Successfully sent verification email to ${email}.`)
        resolve()
      })
    })
  }

  validate()
    .then(() => accountValidate())
    .then(() => sendRecoveryEmail())
    .then(() => {
      // insert recovery request in database
      const insertRecoveryRecordQuery = `INSERT INTO SkillSeek.account_recovery_hashes\
                                            (hash,\
                                              associated_uid,\
                                              hash_expiry_date)\
                                          VALUES\
                                            (?,\
                                            ?\,
                                            ?);`

      return mySQL.execute(insertRecoveryRecordQuery, [hash, uid, expiryDate])
    })
    .then((results, fields) => {
      if (results && results[0].affectedRows === 1) {
        req.flash('success', 'Recovery process intiated. Please check your email.')
        printers.successPrint('Recovery process intiated. Please check your email.')
        res.redirect('/')
      } else {
        throw new UserError('Server Error. Please try again later.', '/recovery', 200)
      }
    })
    .catch((err) => {
      // if account found and request has not been made yet
      if (uid && !reqMade) {
        const deletionQuery = 'DELETE FROM SkillSeek.account_recovery_hashes\
                               WHERE associated_uid = ?;'
        
        //delete request
        mySQL.execute(deletionQuery, [uid])
      }

      if (err instanceof UserError) {
        req.flash('error', err.getMessage())
        printers.errorPrint(err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL())
      }

      next(err)
    })
})

/**
 * Render credentials reset form
 * Check if hash is provided & valid to grant access to page.
 */
router.get('/credentials', routeProtectors.allowUnloggedUser, (req, res, next) => {
  new Promise((resolve) => {
    if (!req.query.hash) {
      throw new UserError('Invalid request.', '/', 200)
    }

    resolve()
  })
    .then(() => {
      const hashCheckQuery = 'SELECT hash_id FROM account_recovery_hashes WHERE hash = ?;'
      //check if hash exists in database
      return mySQL.execute(hashCheckQuery, [req.query.hash])
    })
    .then((results, fields) => {
      if (results && results[0][0]) {
        res.render('credential_submission', { title: 'Set Credentials' })
      } else {
        throw new UserError('Invalid request.', '/', 200)
      }
    })
    .catch(err => {
      if (err instanceof UserError) {
        req.flash('error', err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL())
      }
      next(err)
    })
})

/**
 * Submit and set new password
 */
router.post('/credentials-submission', routeProtectors.allowUnloggedUser, (req, res, next) => {
  const password = req.body.password
  const cPassword = req.body.cPassword
  const hash = req.body.hash

  let hash_id
  let uid

  // character validation
  const validate = () => {
    return new Promise((resolve) => {
      if (!password || password.length > 128 || password.length < 8 ||
        password.search(/[\x22]|[\x27]|[\x5C]|[\x60]|[\x7F]/) !== -1) {
        
          throw new UserError('Invalid password.', `/recovery/credentials?hash=${hash}`, 200)
      }

      if (!cPassword || cPassword.length > 128 || cPassword.length < 8 || 
        cPassword.search(/[\x22]|[\x27]|[\x5C]|[\x60]|[\x7F]/) !== -1) {

        throw new UserError('Invalid password.', `/recovery/credentials?hash=${hash}`, 200)
      }

      if(password !== cPassword){
        throw new UserError('Passwords do not match.', `/recovery/credentials?hash=${hash}`, 200)
      }

      resolve()
    })
  }

  // check if hash exists in database
  const checkRecoveryRequest = () => {
    const checkForExistingRecoveryRequest = `SELECT\
                                              hash_id,\
                                              associated_uid
                                            FROM\
                                              SkillSeek.account_recovery_hashes\
                                            WHERE hash = ?;`

    const promise = mySQL.execute(checkForExistingRecoveryRequest, [hash])
      .then((results, fields) => {
        
        // if hash exists
        if (results && results[0][0]) {
          
          hash_id = results[0][0].hash_id
          uid = results[0][0].associated_uid

          return Promise.resolve()
        }

        throw new UserError('No active recovery request found.', '/', 200)
      })

    return Promise.all([promise]) //await promise then return resolved promise
  }

  // update user credentials and delete account recovery record
  const updateDatabase = () => {
    const updateQuery = 'UPDATE\
                            SkillSeek.users\
                         SET\
                            password = ?\
                         WHERE uid = ?;'

    const deleteQuery = 'DELETE FROM SkillSeek.account_recovery_hashes\
                        WHERE hash_id = ?;'

    const enciphered = cryptoJS.SHA3(
      password, 
      { outputLength: 256}
    ).toString(cryptoJS.enc.Base64) // encipher password

    // update user credentials
    const updatePromise = mySQL.execute(updateQuery, [enciphered, uid])
      .then((results, fields) => {
        if (results && results[0].affectedRows === 1) {
          return Promise.resolve()
        }

        throw new UserError('Server error. Please try again.', '/', 200)
      })

    // delete hash record
    const deletePromise = mySQL.execute(deleteQuery, [hash_id])
      .then((results, fields) => {
        if (results && results[0].affectedRows == 1) {
          return Promise.resolve()
        }

        throw new UserError('Server error. Please try again.', '/', 200)
      })

    return Promise.all([updatePromise, deletePromise]) // wait for promises to resolve or one to fail and return promise;
  }

  validate()
    .then(() => checkRecoveryRequest())
    .then(() => updateDatabase())
    .then(() => {
      req.flash('success', 'Password reset. Please login.')
      printers.successPrint('Password Reset.')
      res.redirect('/login')
    })
    .catch(err => {
      if (err instanceof UserError) {
        req.flash('error', err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL())
      }

      next(err)
    })
})

module.exports = router
