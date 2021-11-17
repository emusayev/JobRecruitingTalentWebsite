const mySQL = require('../config/database')

const listingMiddleware = {}

/**
 * Generate most recent job listings for the home page.
 * Results will be stored in res.locals.results in an array. Each listing will be stored as follows:
 * res.locals.results = [listing1, listing2, listing 3, ...]
 * Each listing will contain the fields shown in the query below in JSON format.
 * Dates must be converted to local time on the front end.
 */
listingMiddleware.generateMostRecent = (req, res, next) => {
  const query = 'SELECT\
                        jobListing.listing_id,\
                        jobListing.jobTitle,\
                        jobListing.location,\
                        jobListing.expiryDate,\
                        jobListing.hidden,\
                        jobListing.expired,\
                        profileOrg.logo,\
                        users.username,\
                        users.firstname\
                    FROM\
                        SkillSeek.jobListing\
                    INNER JOIN SkillSeek.users ON jobListing.poster_id = users.uid\
                    INNER JOIN SkillSeek.profileOrg ON jobListing.poster_id = profileOrg.fk_uid\
                    WHERE jobListing.expired = 0 AND jobListing.hidden = 0\
                    ORDER BY jobListing.listing_id DESC LIMIT 15;'

  mySQL.execute(query)
    .then((results, fields) => {
      if (results && results[0].length !== 0) {
        res.locals.results = []

        // place results in res.locals.results array to display on homepage
        for (let row of results[0]) {
          row = JSON.parse(JSON.stringify(row)) // convert rows to json

          if (req.session.isStudent) {
            row.isStudent = true
          } else if (req.session.isTeacher) {
            row.isTeacher = true
          } else if (req.session.isEmployer) {
            row.isEmployer = true
          }

          res.locals.results.push(row)
        }
      }

      if (req.session.userId && req.session.isStudent) {
        // check if user has applied to job listing.
        const checkIfApplied = 'SELECT\
                                        jobApplicant.listing_id\
                                    FROM\
                                        SkillSeek.jobApplicant\
                                    WHERE jobApplicant.applicant_uid = ?;'

        return mySQL.execute(checkIfApplied, [req.session.userId])
      } else {
        // end promise and go to next page
      }
    })
    .then((results, fields) => {
      if (results) {
        // iterate through all of user's applications
        for (let row of results[0]) {
          row = JSON.parse(JSON.stringify(row)) // convert rows to json

          // iterate through job listing's display on homepage
          for (const jobListing of res.locals.results) {
            // if applicant has applied to job listing & stop inner loop when found
            if (jobListing.listing_id === row.listing_id) {
              jobListing.applied = true
              break
            }
          }
        }
      }
      next()
    })
    .catch(err => {
      next(err)
    })
}

module.exports = listingMiddleware
