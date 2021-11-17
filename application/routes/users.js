const express = require('express')
const router = express.Router()

const secret = require('../config/email.json').secret
const mySQL = require('../config/database')

const crypto = require('crypto-js')
const fetch = require('node-fetch')

const UserError = require('../helpers/errors/UserError')
const printers = require('../helpers/debug/DebugAlerts')
const routeProtectors = require('../middleware/route_protectors')

/**
 * User registration.
 * Creates new user account.
 */
router.post('/registration', routeProtectors.allowUnloggedUser, (req, res, next) => {
  const username = (req.body.username).toLowerCase()
  const password = req.body.password
  const cPassword = req.body.confirmPassword
  const email = req.body.email
  const firstName = req.body.first
  const lastName = req.body.last
  const dob = req.body.dob
  const accountType = req.body.accountType
  let userid
  let employer = true

  // Character Validation and HTML Tampering Check
  // -------------------------------------------------------------------------------------------------------------------------
  const validation = () => {
    return new Promise((resolve) => {
      if (!req.body.cookies || !req.body.tosps || !password || 
        !cPassword || !username || !dob || !accountType || !email) {
        throw new UserError('Registration form is invalid. Please try again.', '/register', 200)
      }

      if (accountType !== 'employer') {
        employer = false

        if (!lastName) {
          throw new UserError('Invalid character detected in name.', '/register', 200)
        }
      }

      if (firstName.search(/[\x21-\x2C]|[\x2E-\x40]|[\x5B-\x60]|[\x7B-\x7F]|[-]{2,}/) != -1) {
        throw new UserError('Invalid character detected in name.', '/register', 200)
      }

      if (!employer && lastName.search(/[\x21-\x2C]|[\x2E-\x40]|[\x5B-\x60]|[\x7B-\x7F]|[-]{2,}/) != -1) {
        throw new UserError('Invalid character detected in name.', '/register', 200)
      }

      if (firstName.length > 126 || (!employer && lastName.length > 126)) {
        throw new UserError('Name out of bounds.', '/register', 200)
      }

      if (username.length > 62 || 
        username.search(/[\x20-\x2C]|[\x2E-\x2F]|[\x3A-\x40]|[\x5B-\x5E]|[\x60]|[\x7B-\x7F]|[-]{2,}/) != -1) {
        throw new UserError('Invalid username.', '/register', 200)
      }

      if (password.length > 128 || password.length < 8 || password.search(/[\x22]|[\x27]|[\x5C]|[\x60]|[\x7F]|[-]{2,}/) != -1) {
        throw new UserError('Invalid password.', '/register', 200)
      }

      if (password.localeCompare(cPassword) != 0) {
        throw new UserError('Passwords do not match. Please try again', '/register', 200)
      }

      if(email.search(/[\\]|[-]{2,}|[@]{2,}/) !== -1){
        throw new UserError('Invalid Email.', '/register', 200)
      }

      resolve()
    })
  }
  // -------------------------------------------------------------------------------------------------------------------------

  validation()
    .then(() => {
      // check database for identical username and email
      return mySQL.execute('SELECT username, email FROM SkillSeek.users WHERE username = ? OR email = ?;', [username, email])
    })
    .then((results, fields) => {
      if (results && results[0].length != 0) {
        throw new UserError('Sorry username or email are already in use. Please try again', '/register', 200)
      }

      let query

      // encipher string and convert to base64 encoding
      const enciphered = crypto.SHA3(password, { outputLength: 256 }).toString(crypto.enc.Base64) 

      // generate random userid using aes
      userid = crypto.AES.encrypt(`${username} + ${email} + ${password}`, enciphered).toString()
      userid = crypto.enc.Base64.parse(userid).toString(crypto.enc.Hex)
      userid = parseInt(userid.substring(userid.length - 8), 16)

      // insert user information to users table

      if (accountType !== 'employer') {
        query = 'INSERT INTO SkillSeek.users\
                  (uid,\
                  username,\
                  password,\
                  firstname,\
                  lastname,\
                  email,\
                  accType,\
                  dateOfBirth)\
                VALUES  (?, ?, ?, ?, ?, ?, ?, ?);'
        return mySQL.execute(query, [userid,
            username,
            enciphered,
            firstName,
            lastName,
            email,
            accountType,
            dob]) // return promise
      }

      query = 'INSERT INTO SkillSeek.users\
                (uid,\
                username,\
                password,\
                firstname,\
                email,\
                accType,\
                dateOfBirth)\
              VALUES (?, ?, ?, ?, ?, ?, ?);'
      return mySQL.execute(query, [userid,
        username, 
        enciphered, 
        firstName, 
        email, 
        accountType, 
        dob])
    })
    .then((results, fields) => {
      if (!results || !results[0].affectedRows) {
        throw new UserError('Server Error. Account could not be created.', '/register', 500)
      }

      // generate profile.
      if (accountType !== 'employer') {
        return mySQL.execute('INSERT INTO SkillSeek.profileIndividual (fk_uid) VALUES (?);',
        [userid])
      } else {
        return mySQL.execute('INSERT INTO SkillSeek.profileOrg (fk_uid) VALUES (?);', [userid])
      }
    })
    .then(() => {
      // send verification email.
      return new Promise(async (resolve) => {
        const response = await fetch('https://localhost/verify/initialize', {
          body: JSON.stringify({ firstname: firstName, userId: userid, email: email, secret: secret }),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'POST'
        })

        if (response instanceof UserError) {
          throw response //TODO: change this
        }

        resolve()
      })
    })
    .then((results, fields) => {
      printers.successPrint(`Welcome to the community, ${username}.`)
      res.redirect('/verification') // redirect to verification page
    })
    .catch(err => {
      if (err instanceof UserError) {
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
 * User Login
 * Access account, verify credentials
 */
router.post('/login', routeProtectors.allowUnloggedUser, (req, res, next) => {
  const username = (req.body.username).toLowerCase()
  const password = req.body.password
  const query = 'SELECT uid, username, password, accType, verified FROM SkillSeek.users WHERE username = ?;'

  // Character Validation and HTML Tampering Check
  const validation = () => {
    return new Promise((resolve) => {
       // check for out of bounds usernames and invalid characters
      if (!username || username.length > 62 || 
        username.search(/[\x20-\x2C]|[\x2E-\x2F]|[\x3A-\x40]|[\x5B-\x5E]|[\x60]|[\x7B-\x7F]|[-]{2,}/) !== -1) {
        throw new UserError('Invalid username.', '/login', 200)
      }

      if (!password || password.length < 8 || password.length > 128 ||
        password.search(/[\x22]|[\x27]|[\x5C]|[\x60]|[\x7F]|[-]{2,}/) !== -1) { // check for out of bounds passwords and invalid characters
        throw new UserError('Invalid password.', '/login', 200)
      }
      resolve()
    })
  }
  // -------------------------------------------------------------------------------------------------------------------------

  // get user info from DB
  validation()
    .then(() => {
      return mySQL.execute(query, [username])
    })
    .then((results, fields) => {
      if (results && results[0].length === 1) { // check for results and # of results
        const enciphered = results[0][0].password // encriphered password from db
        
        //hash user input and convert to base64 encoding
        const hashedUserInput = crypto.SHA3(password, { outputLength: 256 }).toString(crypto.enc.Base64)
        
        // const unciphered = crypto.AES.decrypt(enciphered, key) // decrypt AES password

        // check if email verified
        if (results[0][0].verified === 0) {
          throw new UserError('Please verify your account.', '/login', 200)
        }

        // password check
        if (enciphered !== hashedUserInput) {
          throw new UserError('Invalid login credentials.', '/login', 200)
        }

        printers.successPrint(`User ${username} has logged in.`)
        req.session.username = username // generate session
        req.session.userId = results[0][0].uid
        req.session.accountType = results[0][0].accType
        res.locals.logged = true

        if (req.session.accountType === 'employer') {
          req.session.isEmployer = true
        } else if (req.session.accountType === 'teacher') {
          req.session.isTeacher = true
        } else {
          req.session.isStudent = true
        }
        req.flash('success', `Welcome back, ${username}.`)
        res.redirect('/')
      } else {
        throw new UserError('Invalid login credentials.', '/login', 200)
      }
    })
    .catch(err => {
      if (err instanceof UserError) {
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
 * Logging out.
 * Terminating user session and cookies.
 */
router.post('/logout', routeProtectors.allowLoggedUser, (req, res, next) => {
  if (req.session) {
    // destroy user session
    req.session.destroy(err => {
      if (err) {
        printers.errorPrint('Session could not be destroyed')
        next(err)
      } else {
        printers.successPrint('Session was destroyed')
        res.clearCookie('csid')
        res.json({ status: 'Success', message: 'User is logged out.' })
        res.redirect('/')
      }
    })
  }
})

/**
 * Check db for email availability during registration
 */
router.get('/email', routeProtectors.allowUnloggedUser, (req, res, next) => {
  const email = req.query.email

  if(email) {
    const checkEmail = 'SELECT\
                          email\
                        FROM\
                          SkillSeek.users\
                        WHERE users.email = ?;'

    if(email.search(/[\\]|[-]{2,}|[@]{2,}/) !== -1){
      return res.send({invalidEmail: true})
    }

    mySQL.execute(checkEmail, [email])
      .then((results, fields) => {
        if(results && results[0].length >= 1){
          return res.send({emailAvailable: false})  //email in use send json response
        } else {
          return res.send({emailAvailable : true}) //email not in use send json response 
        }
      })
      .catch(err => next(err))
  }
})

/**
 * Check db for username availability during registration
 */
 router.get('/username', routeProtectors.allowUnloggedUser, (req, res, next) => {
  const username = req.query.username
  
  if(username) {
    const checkUsername = 'SELECT\
                          username\
                        FROM\
                          SkillSeek.users\
                        WHERE users.username = ?;'

    if(username.search(/[\x20-\x2C]|[\x2E-\x2F]|[\x3A-\x40]|[\x5B-\x5E]|[\x60]|[\x7B-\x7F]|[-]{2,}/) !== -1){
      return res.send({invalidUsername: true});
    } else {

    }

    mySQL.execute(checkUsername, [req.query.username])
      .then((results, fields) => {
        if(results && results[0].length >= 1){
          return res.send({usernameAvailable: false})  //username in use send json response
        } else {
          return res.send({usernameAvailable : true}) //username not in use send json response      
        }
      })
      .catch(err => next(err))
  }
})

module.exports = router
