const express = require('express')
const router = express.Router()

const mySQL = require('../config/database')
const UserError = require('../helpers/errors/UserError')
const PostError = require('../helpers/errors/PostError')
const printers = require('../helpers/debug/DebugAlerts')
const routeProtectors = require('../middleware/route_protectors')
const profileRetriever = require('../middleware/profile_middleware')
const key = require('../config/AESkey.json').aes_key

const fs = require('fs')
const multer = require('multer')
const sharp = require('sharp')
const crypto = require('crypto')
const cryptoJS = require('crypto-js')

// set diskstorage location and filename of downloaded files
const hostelStore = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/client_store/downloads_hostel')
  },
  filename: (req, file, cb) => {
    const fileExt = file.mimetype.split('/')[1]
    const fileName = crypto.randomBytes(22).toString('hex')
    cb(null, `${fileName}.${fileExt}`)
  }
})

const destHostel = multer({ storage: hostelStore })

/**
 * Render edit page for students and teachers
 * Route protectors to ensure logged in & deny users of wrong type access page.
 */
router.get('/user', routeProtectors.allowLoggedUser, routeProtectors.nonEmployerAccountTypeAccess, profileRetriever.generateEdit, (req, res, next) => {
  let dob = new Date(res.locals.results.dateOfBirth) // convert to to date obj
  if (dob) {
    dob = dob.getFullYear() + '-' + Number(dob.getMonth() + 1).toString().padStart(2, '0') + '-' + dob.getDate().toString().padStart(2, '0')
  }

  let max = new Date(Date.now()) // get today's date
  max = max.getFullYear() + '-' + Number(max.getMonth() + 1).toString().padStart(2, '0') + '-' + max.getDate().toString().padStart(2, '0')

  res.render('editprofile', // pass in values from database to rendered handlebar file
    {
      resume: res.locals.results.resume,
      image: res.locals.results.profilepicture,
      title: req.session.username,
      firstname: res.locals.results.firstname,
      lastname: res.locals.results.lastname,
      description: res.locals.results.description,
      gender: res.locals.results.gender,
      demographic: res.locals.results.demographic,
      dateOfBirth: dob,
      max: max,
      profession: res.locals.results.currentProfession,
      location: res.locals.results.location
    })
})

/**
 * Render edit page for employer profiles.
 * Route protectors to ensure logged in & deny users of wrong type access page.
 */
router.get('/org', routeProtectors.allowLoggedUser, routeProtectors.employerAccountTypeAccess, profileRetriever.generateEdit, (req, res, next) => {
  let dob = new Date(res.locals.results.dateOfBirth) // convert to to date obj
  if (dob) {
    dob = dob.getFullYear() + '-' + Number(dob.getMonth() + 1).toString().padStart(2, '0') + '-' + dob.getDate().toString().padStart(2, '0')
  }

  let max = new Date(Date.now()) // get today's date
  max = max.getFullYear() + '-' + Number(max.getMonth() + 1).toString().padStart(2, '0') + '-' + max.getDate().toString().padStart(2, '0')


  res.render('editprofile', // pass in values from database to handlebar file
    {
      logo: res.locals.results.logo,
      title: req.session.username,
      firstname: res.locals.results.firstname,
      description: res.locals.results.description,
      dateOfBirth: dob,
      max: max,
      location: res.locals.results.location
    })
})

/**
 * Update user password.
 */
router.post('/updatePassword', (req, res, next) => {
  const password = req.body.password
  const cPassword = req.body.confirmPassword

  const validate = () => {
    return new Promise((resolve) => {
      // ensure password typed properly
      if (password !== cPassword) {
        if (!req.session.isEmployer) {
          throw new UserError('Passwords do not match!', '/editUser', 200)
        } else {
          throw new UserError('Passwords do not match!', '/editOrg', 200)
        }
      }

      // character validation
      if (password.length > 128 || password.length < 8 || password.search(/[\x22]|[\x27]|[\x5C]|[\x60]|[\x7F]/) !== -1) {
        if (!req.session.isEmployer) {
          throw new UserError('Invalid password!', '/editUser', 200)
        } else {
          throw new UserError('Invalid password!', '/editOrg', 200)
        }
      }

      resolve()
    })
  }

  // grab existing password from db
  mySQL.execute('SELECT password FROM SkillSeek.users WHERE uid = ?;', [req.session.userId]) // check if new pass different than current password
    .then((results, fields) => {

      if (results && results[0].length === 1) {
        const unciphered = cryptoJS.AES.decrypt(results[0][0].password, key).toString(cryptoJS.enc.Utf8) // decrypt password

        if (password === unciphered) { // check if password is different than prior
          if (!req.session.isEmployer) {
            throw new UserError('New and current password are identical.', '/edit/user', 200)
          }

          throw new UserError('New and current password are identical.', '/edit/org', 200)
        }
      }
      return validate() // call character validation function
    })
    .then(() => {
      const enciphered = cryptoJS.AES.encrypt(password, key).toString() // encipher password and convert to string
      return mySQL.execute('UPDATE SkillSeek.users SET password = ? WHERE uid = ?;', [enciphered, req.session.userId]) // update db
    })
    .then((results, fields) => {
      if (results[0].affectedRows === 0) {
        if (!req.session.isEmployer) {
          throw new UserError('Server Error. Please try again later.', '/edit/user', 200)
        } else {
          throw new UserError('Server Error. Please try again later.', '/edit/org', 200)
        }
      }

      req.flash('success', 'Password has been updated.')
      printers.successPrint('Password has been updated.')
      res.redirect('/profile')
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

/**
 * Edit information on user (student teacher) profile
 * Handles image and resume upload.
 * Downloaded files are stored in /public/client_store/display_pictures or /public/client_store/resumes
*/
router.post('/updateUser', routeProtectors.allowLoggedUser, routeProtectors.nonEmployerAccountTypeAccess, destHostel.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), (req, res, next) => {
  // grab data from form
  const firstname = req.body.first
  const lastname = req.body.last
  const prof = req.body.profession
  const gender = req.body.gender
  const demographic = req.body.demographic
  const dob = req.body.dob
  const description = req.body.description
  const location = req.body.location

  // files uploaded
  let resume
  let image

  // files existing in filesystem
  let oldResume
  let oldImage

  // character validation
  const validate = () => {
    return new Promise((resolve) => {
      if (!firstname || !lastname || !prof || !gender || !demographic || !dob || !description || !location) {
        throw new PostError('Please fill all information fields before sumbitting.', '/editUser', 200)
      }

      if (firstname.length > 126 || lastname.length > 126 || gender.length > 11 || location.length > 126 ||
          demographic.length > 126 || prof.length > 126 || description.length > 4094) {
        throw new PostError('', '/editOrg', 200)
      }

      if (firstname.search(/[\x21-\x2C]|[\x2E-\x40]|[\x5B-\x60]|[\x7B-\x7F]/) !== -1 
          && lastname.search(/[\x21-\x2C]|[\x2E-\x40]|[\x5B-\x60]|[\x7B-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in name.', '/editUser', 200)
      }

      if (description.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in description.', '/editUser', 200)
      }

      if (prof.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in profession.', '/editUser', 200)
      }

      if (demographic.search(/[\x21-\x2C]|[\x2E-\x40]|[\x5B-\x60]|[\x7B-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in profession.', '/editUser', 200)
      }

      if (gender.search(/[\x21-\x2C]|[\x2E-\x40]|[\x5B-\x60]|[\x7B-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in profession.', '/editUser', 200)
      }

      if (location.search(/[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in location.', '/editUser', 200)
      }

      return resolve() // if all input is valid
    })
  }

  // function to handle images and resumes
  const handleFiles = () => {
    new Promise((resolve) => {
      if (req.files) {
        if (req.files.resume && req.files.image) { // if new image and resume uploaded
          return Promise.all([handleImage(), handleResume()])
        } else if (req.files.image) { // if new image uploaded
          return handleImage()
        } else if (req.files.resume) { // if new resume loaded
          return handleResume()
        }
      }

      return resolve() // if no files are uploaded
    })
  }

  const handleImage = () => {
    image = req.files.image[0]

    const checkForExisitingImageQuery = 'SELECT\
                                                profilepicture\
                                            FROM\
                                                SkillSeek.profileIndividual\
                                            WHERE profileIndividual.fk_uid = ?;'

    mySQL.execute(checkForExisitingImageQuery, [req.session.userId]) // check for existing image in filesystem
      .then((results, fields) => {
        oldImage = results[0][0].profilepicture

        // check if file is an image
        if (image.mimetype.split('/')[0] !== 'image') {
          throw new PostError('Upload Error. Please upload a valid image file.', '/editUser', 200)
        }

        if (oldImage) {
          // delete existing profile picture from filesystem
          try {
            // check if file exists in filesystem else throw error
            fs.accessSync(oldImage, fs.constants.R_OK)

            // delete
            fs.unlink(oldImage, err => {
              if (err) { throw new PostError('Upload Error. Profile picture update failed.', '/editUser', 200) }
            })
          } catch (err) {
            // do nothing & continue execution
          }
        }

        sharp(image.path) // initialize sharp with provided image
          .resize({ height: 400, width: null, fit: 'inside' }) // resize image and preserve aspect ratio
          .toFile(`public/client_store/display_pictures/${image.filename}`) // save image to give path
          .then(() => {
            fs.unlink(image.path, err => { // delete original image that was downloaded
              if (err) { throw new PostError('Upload Error. Profile picture update failed.', '/editUser', 200) }
            })
          })

        // update image path in database
        const updateQuery = 'UPDATE\
                                    SkillSeek.profileIndividual\
                                SET\
                                    profilepicture = ?\
                                WHERE fk_uid = ?;'
        return mySQL.execute(updateQuery, [
                `public/client_store/display_pictures/${image.filename}`,
                req.session.userId
        ])
      })
  }

  const handleResume = () => {
    resume = req.files.resume[0]

    const checkForExisitingResumeQuery = 'SELECT\
                                                resume\
                                            FROM\
                                                SkillSeek.profileIndividual\
                                            WHERE fk_uid = ?;'

    mySQL.execute(checkForExisitingResumeQuery, [req.session.userId])
      .then((results, fields) => {
        oldResume = results[0][0].resume

        // check if file is a pdf
        if (resume.mimetype !== 'application/pdf') {
          throw new PostError('Upload Error. Please upload a valid PDF file.', '/editUser', 200)
        }

        // move file to new directory
        fs.rename(resume.path, `public/client_store/resumes/${resume.filename}`, err => {
          if (err) { throw new PostError('Server Error. Resume could not be updated.', '/editUser', 200) }
        })

        // if resume exists in database
        if (oldResume) {
          try {
            // check if file exists in filesystem else throw error
            fs.accessSync(oldResume, fs.constants.R_OK)

            // delete
            fs.unlink(oldResume, err => { /* should not fail */ })
          } catch (err) {
            // do nothing & continue execution
          }
        }

        const updateQuery = 'UPDATE\
                                    SkillSeek.profileIndividual\
                                SET\
                                    resume = ?\
                                WHERE fk_uid = ?;'

        return mySQL.execute(updateQuery, [
                `public/client_store/resumes/${resume.filename}`,
                req.session.userId
        ])
      })
  }

  validate()
    .then(() => {
      if (req.files) {
        handleFiles()
      } else {
        Promise.resolve()
      }
    })
    .then(() => {
      // update user bio on profile
      const updateQuery = 'UPDATE\
                                SkillSeek.users,\
                                SkillSeek.profileIndividual\
                            SET\
                                users.firstname = ?,\
                                users.lastname = ?,\
                                profileIndividual.gender = ?,\
                                profileIndividual.demographic = ?,\
                                users.dateOfBirth = ?,\
                                profileIndividual.description = ?,\
                                profileIndividual.location = ?, \
                                profileIndividual.currentProfession = ?\
                            WHERE users.uid = ? AND profileIndividual.fk_uid = ?;'

      return mySQL.execute(updateQuery, [
        firstname,
        lastname,
        gender,
        demographic,
        dob,
        description,
        location,
        prof,
        req.session.userId,
        req.session.userId
      ])
    })
    .then(() => {
      req.flash('success', 'Profile updated!')
      printers.successPrint(`${req.session.username}'s profile updated.`)
      res.redirect('/profile')
    })
    .catch(err => {
      // delete downloaded image if it exists
      if (image) {
        try {
          fs.accessSync(image.path, fs.constants.R_OK) // check if it exists in the fs
          fs.unlink(image.path, err => { /* should not fail */ })
        } catch (error) {
          // execute normally
        }
      }
      // delete downloaded resume if it exists
      if (resume) {
        try {
          fs.accessSync(resume.path, fs.constants.R_OK) // check if file exists in the fs
          fs.unlink(resume.path, err => { /* should not fail */ })
        } catch (error) {
          // execute normally
        }
      }

      // delete existing image (old)
      if (oldImage) {
        try {
          fs.accessSync(oldImage, fs.constants.R_OK) // checkif file exists in the fs
          fs.unlink(oldImage, err => { /* should not fail */ })
        } catch (error) {
          // continue execution normally
        }
      }

      // delete existing resume (old)
      if (oldResume) {
        try {
          fs.accessSync(oldResume, fs.constants.R_OK) // check if image exists in filesystem
          fs, unlunk(oldResume, err => { /* should not fail */ })
        } catch (error) {
          // continue exectution normally
        }
      }

      // remove path to image and resume from to db
      const clearImageAndResume = 'UPDATE\
                                        SkillSeek.profileIndividual\
                                    SET\
                                        profilepicture = NULL\
                                        resume = NULL\
                                    WHERE profileIndividual.fk_uid = ?;'

      mySQL.execute(clearImageAndResume, [req.session.userId]) // execute query

      if (err instanceof PostError) {
        printers.errorPrint(err.getMessage())
        req.flash('error', err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL)
      } else {
        next(err)
      }
    })
})

/**
 * Edit information on employer profile.
 * Handles image upload.
 * Downloaded files are stored in /public/client_store/org_logo
*/
router.post('/updateOrg', routeProtectors.allowLoggedUser, routeProtectors.employerAccountTypeAccess, destHostel.single('image'), (req, res, next) => {
  const orgName = req.body.first
  const dateOfEstablishment = req.body.dob
  const description = req.body.description
  const location = req.body.location

  let logo // downloaded logo
  let oldLogo // current logo

  // character validation
  const validate = () => {
    return new Promise((resolve) => {
      if (!orgName || !dateOfEstablishment || !description || !location) {
        throw new PostError('Please fill all information fields before submitting.', '/editOrg', 200)
      }

      if (orgName.length > 126 || location.length > 126 || description.length > 4094) {
        throw new PostError('Invalid character detected in name.', '/editOrg', 200)
      }

      if (orgName.search(/[\x21-\x2C]|[\x2E-\x40]|[\x5B-\x60]|[\x7B-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in name.', '/editOrg', 200)
      }

      if (description.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in description.', '/editOrg', 200)
      }

      if (location.search(/[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in location.', '/editOrg', 200)
      }

      resolve()
    })
  }

  // handle org logos
  const handleImage = () => {
    logo = req.file

    if (!logo) {
      return Promise.resolve()
    }

    const checkForExisitingImageQuery = 'SELECT\
                                                logo\
                                            FROM\
                                                SkillSeek.profileOrg\
                                            WHERE profileOrg.fk_uid = ?;'

    mySQL.execute(checkForExisitingImageQuery, [req.session.userId]) // check for existing image in filesystem
      .then((results, fields) => {
        oldLogo = results[0][0].logo

        // check if file is an image
        if (logo.mimetype.split('/')[0] !== 'image') {
          throw new PostError('Upload Error. Please upload a valid image file.', '/editUser', 200)
        }

        // check if a logo is in the db
        if (oldLogo) {
          try {
            // check if files is in filesystem
            fs.accessSync(oldLogo, fs.constants.R_OK)

            // delete
            fs.unlink(oldLogo, err => { /* should not fail */ })
          } catch (err) {
            // do nothing & continue to execute
          }
        }

        sharp(logo.path) // initialize sharp with provided image
          .resize({ height: 400, width: null, fit: 'inside' }) // resize image and preserve aspect ratio
          .toFile(`public/client_store/org_logos/${logo.filename}`) // save image to give path
          .then(() => {
            fs.unlink(logo.path, err => { // delete original image that was downloaded
              if (err) { throw new PostError('Upload Error. Profile picture update failed.', '/editUser', 200) }
            })
          })

        const updateQuery = `UPDATE\
                                    SkillSeek.profileOrg\
                                SET\
                                    logo = ?
                                WHERE profileOrg.fk_uid = ?;`

        return mySQL.execute(updateQuery, [`public/client_store/org_logos/${logo.filename}`, req.session.userId])
      })
  }

  validate() // call character validation
    .then(() => handleImage()) // hangle downloaded image
    .then(() => {
      // update org profile
      const updateQuery = 'UPDATE\
                                SkillSeek.users,\
                                SkillSeek.profileOrg\
                            SET\
                                users.firstname = ?,\
                                users.dateOfBirth = ?,\
                                profileOrg.description = ?,\
                                profileOrg.location = ? \
                            WHERE users.uid = ? AND profileOrg.fk_uid = ?;'

      return mySQL.execute(updateQuery, [
        orgName,
        dateOfEstablishment,
        description,
        location,
        req.session.userId,
        req.session.userId
      ])
    })
    .then(() => {
      req.flash('success', 'Profile updated!')
      printers.successPrint(`${req.session.user}'s profile updated.`)
      res.redirect('/profile')
    })
    .catch(err => {
      // delete downloaded logo
      if (logo) {
        try {
          fs.accessSync(image.path, fs.constants.R_OK) // check if downloaded logo exists in the fs
          fs.unlink(image.path, err => { /* should not fail */ })
        } catch (error) {
          // execute normally
        }
      }

      // delete current logo (old)
      if (oldLogo) {
        try {
          fs.accessSync(oldLogo, fs.constants.R_OK) // check if old logo exists in the fs
          fs.unlink(logo, err => { /* should not fail */ })
        } catch (error) {
          // continue execution normally
        }
      }

      // clear logo path record from db
      const clearLogoQuery = 'UPDATE\
                                SkillSeek.profileOrg\
                              SET\
                                logo = NULL\
                              WHERE profileOrg.fk_uid = ?;'

      mySQL.execute(clearLogoQuery, [req.session.userId])

      if (err instanceof PostError) {
        printers.errorPrint(err.getMessage())
        req.flash('error', err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL)
      } else {
        next(err)
      }
    })
})

module.exports = router
