const express = require('express')
const router = express.Router()

const mySQL = require('../config/database')
const printers = require('../helpers/debug/DebugAlerts')
const PostError = require('../helpers/errors/PostError')
const PermissionsError = require('../helpers/errors/PermissionsError')
const routeProtectors = require('../middleware/route_protectors')
const applicantsRetriever = require('../middleware/applicants_middleware')

/**
 * Render job listing applicants and job listing info. (Employer and listing poster only)
 */
router.get('/view/:listingId', routeProtectors.userSpecificAccess, applicantsRetriever.generateListingApplicants, (req, res, next) => {
  res.render('listing_details', {
    title: res.locals.results[0].jobTitle
  })
})

/**
 * Post a job listing. (Employers only)
 */
router.post('/add', (req, res, next) => {
  const uid = req.session.userId
  const jobTitle = req.body.jobTitle
  const jobLocation = req.body.location
  const description = req.body.description
  const expiryDate = req.body.endDate

  // maybe construct promise to perform error check to be able to catch errors with .catch by promise chaining
  if (!req.session.isEmployer) {
    throw new PermissionsError('Only employers may create job listings.', '/profile', 200)
  }

  // character validation check
  // ensure expiry date is not in the past!!!!!
  const validate = () => {
    return new Promise((resolve) => {
      if (!jobTitle || !jobLocation || !description || !expiryDate) {
        throw new PostError('Please fill all required information fields before sumbitting.',
                            '/profile', 
                            200)
      }

      if (jobTitle.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in experience field.', '/profile', 200)
      }

      if (jobLocation.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in employer field.', '/profile', 200)
      }

      if (description.search(/[\x2C]|[\x2F]|[\x96]|[\x7E-\x7F]/) !== -1) {
        throw new PostError('Invalid character detected in description field.', '/profile', 200)
      }

      //convert time to UTC time
      let userDate = new Date(expiryDate)
      const tzOffset = userDate.getTimezoneOffset() * 60 * 1000
      userDate = new Date(+userDate + tzOffset) // convert to miliseconds and add offset

      if ((Date.now() - userDate) >= 0) {
        throw new PostError('Expiry date for job listing has elapsed.', '/profile', 200)
      }

      return resolve()
    })
  }

  const query = 'INSERT INTO SkillSeek.jobListing\
                    (poster_id,\
                    jobTitle,\
                    description,\
                    location,\
                    expiryDate)\
                VALUES (?, ?, ?, ?, ?)'
  validate()
    .then(() => {
      return mySQL.execute(query, [uid, jobTitle, description, jobLocation, expiryDate])
    })
    .then((results, fields) => {
      req.flash('success', 'Job listing sucessfully added to your profile.')
      printers.successPrint('Job listing sucessfully added to profile.')
      res.redirect('/profile')
    })
    .catch(err => {
      if (err instanceof PostError || err instanceof PermissionsError) {
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
 * Apply to a job listing.
 */
router.get('/apply', (req, res, next) => {
  let query
  const redirectAddress = req.query.redirectAddress
  const listingId = req.query.listing_id
  
  //ensure user is student and execute query. return resolved promise.
  const validate = () => {
    return new Promise((resolve) => {
      if (req.session.isEmployer || req.session.isTeacher) {
        throw new PostError('Only students my apply for jobs.', redirectAddress, 200)
      }
      query = '(SELECT\
                  jobListing.expired,\
                  jobListing.hidden\
                FROM\
                  SkillSeek.jobListing\
                WHERE jobListing.listing_id = ?)\
                UNION\
                (SELECT\
                  jobApplicant.application_id,\
                  jobApplicant.applicant_uid\
                FROM\
                  SkillSeek.jobApplicant\
                WHERE (jobApplicant.applicant_uid = ? AND jobApplicant.listing_id = ?));'

      return resolve(mySQL.execute(query, [listingId, req.session.userId, listingId]))
    })
  }

  validate()
    .then((results, fields) => {
      let listingInfo
      
      if (results && results[0].length) {
        listingInfo = JSON.parse(JSON.stringify(results[0][0])) //convert to JSON obj
        console.log(listingInfo)
      } else {
        throw new PostError('Server error. Please try again later', redirectAddress, 200)
      }

      //ensure listing is not hidden nor expired
      if (results[0].length === 1 && listingInfo.hidden === '0' && listingInfo.expired === '0') {

        query = 'INSERT INTO SkillSeek.jobApplicant (listing_id, applicant_uid) VALUES (?, ?)'
        return mySQL.execute(query, [listingId, req.session.userId])

      } else {

        if (results[0].length !== 1) {
          throw new PostError('Application has already been submitted.', redirectAddress, 200)
        } else {
          throw new PostError('Could not apply to job listing.', redirectAddress, 200)
        }

      }
    })
    .then((results, fields) => {
      req.flash('success', 'Successfully submit candidacy.')
      printers.successPrint('Successfully submit candidacy.')
      res.redirect(redirectAddress) // modify to stay on page
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
 * Delete listing on profile. (Employer only)
 */
router.post('/delete/:listing_id', (req, res, next) => {
  
  // check if listing belongs to user deleting it
  const query = 'DELETE FROM jobListing\
                WHERE poster_id = ? AND listing_id = ?;'
  mySQL.execute(query, [req.session.userId, req.params.listing_id])
    .then((results, fields) => {
      
      if (!results) {
        throw new PostError('Server Error. Please try again later.', `/profile/${req.session.reqUserProfile}`, 200)
      } if (results && !results[0].affectedRows) {
        throw new PermissionsError('You do not have permission to delete this job listing.', `/profile/${req.session.reqUserProfile}`, 200)
      } else {
        // req.flash('success', 'Listing successfully deleted.')
        printers.successPrint('Listing successfully deleted.')
        res.status(200)
      }
    })
    .catch(err => {
      if (err instanceof PostError || err instanceof PermissionsError) {
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
 * Hide or unhide job listing from home, profile, and search. (Employer Only)
 */
router.get('/hide/:listing_id', (req, res, next) => {
  
  // ensure users can not flip hidden on other's listings
  const query = 'UPDATE jobListing\
                SET\
                  hidden = NOT hidden\
                WHERE poster_id = ? AND listing_id = ?;'

  mySQL.execute(query, [req.session.userId, req.params.listing_id])
    .then((results, fields) => {
      if (!results) {
        throw new PostError('Server Error. Please try again later.', `/profile/${req.session.reqUserProfile}`, 200)
      } else if (results && !results[0].affectedRows) {
        throw new PermissionsError('You do not have permission to hide this job listing.',
                                  `/profile/${req.session.reqUserProfile}`,
                                   200)
      } else {
        req.flash('success', 'Listing successfully hidden from other users.')
        printers.successPrint('Listing successfully hidden from other users.')
        res.redirect('/profile')
      }
    })
    .catch(err => {
      if (err instanceof PostError || err instanceof PermissionsError) {
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