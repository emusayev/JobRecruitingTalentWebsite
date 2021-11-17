const mySQL = require('../config/database')

const printers = require('../helpers/debug/DebugAlerts')
const PermissionsError = require('../helpers/errors/PermissionsError')

const applicantsMiddleWare = {}

// TODO: TEST
/**
 * Middleware function responsible for fetching applicants for specific job listing from database
 * Requires listingID to be supplied from front end.
 */
applicantsMiddleWare.generateListingApplicants = (req, res, next) => {
  const collectData = () => {
    const listingId = req.params.listingId
    const listingQuery = 'SELECT * FROM jobListing WHERE jobListing.listing_id = ?;'
    const applicantsQuery = 'SELECT\
                              users.uid,\
                              users.username,\
                              users.firstname,\
                              users.lastname,\
                              profileIndividual.profilepicture,\
                              profileIndividual.location\
                            FROM\
                              users\
                            INNER JOIN jobApplicant ON applicant_uid = users.uid\
                            INNER JOIN profileIndividual ON profileIndividual.fk_uid = jobApplicant.applicant_uid\
                            WHERE jobApplicant.listing_id = ?;'


    res.locals.results = [] // assign empty array;

    // get listing information
    const listingInfoPromise = () => {
      return new Promise((resolve, reject) => {
        mySQL.execute(listingQuery, [listingId])
          .then((results, fields) => {
            if (results && results[0].length === 1) {
              results = JSON.parse(JSON.stringify(results[0][0])) // convert to JSON obj
              res.locals.results[0] = results
              return resolve()
            }
          })
          .catch(err => {
            throw err
          })
      })
    }

    // generate list of applicants with their user information
    const applicantsPromise = () => {
      return new Promise((resolve, reject) => {
        mySQL.execute(applicantsQuery, [listingId])
          .then((results, fields) => {
            res.locals.results[1] = []

            if (results && results[0].length !== 0) {
              results = JSON.parse(JSON.stringify(results[0])) // convert to JSON obj

              for (const row of results) {
                if (row.profilepicture != null) {
                  row.profilepicture = '/' + row.profilepicture
                }
                res.locals.results[1].push(row)
              }

              return resolve()
            } else {
              return resolve()
            }
          })
          .catch(err => {
            throw err
          })
      })
    }

    // await promises to be resolved
    return Promise.all([listingInfoPromise(), applicantsPromise()])
  }

  collectData()
    .catch(err => {
      if (err instanceof PermissionsError) {
        req.flash(err.getMessage())
        printers.errorPrint(err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL())
      }
    })
    .then(() => {
      console.log(res.locals.results)
      next()
    })
}

module.exports = applicantsMiddleWare
