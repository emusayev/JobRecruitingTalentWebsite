const express = require('express')
const router = express.Router()

const mySQL = require('../config/database')
const printers = require('../helpers/debug/DebugAlerts')
const routeprotectors = require('../middleware/route_protectors')
const SearchError = require('../helpers/errors/SearchError')

/**
 * Search functionality. Must be logged in.
 * Requires search query (can be empty depending on filter) and filter
 * Renders search page with retrieved results
 */
router.get('/', routeprotectors.allowLoggedUser, (req, res, next) => {
  const search = req.query.search
  const filter = req.query.filter
  const errorAddress = req.query.errorAddress

  // character validation
  const validate = () => {
    return new Promise((resolve) => {
      if ((filter === 'Unfiltered' || filter === 'Education') && search.length === 0) {
        throw new SearchError('Invalid seach query.', errorAddress, '200')
      }

      if (search.length > 40 || search.search(/[\x21-\x26]|[\x28-\x40]|[\x5B-\x60]|[\x7B-\x7F]/) !== -1) {
        throw new SearchError('Invalid seach query.', errorAddress, '200')
      }

      resolve()
    })
  }

  // search for matching user & teacher information information
  const userSearch = () => {
    return new Promise((resolve) => {
      let query

      // for non-empty searches
      if (search.length !== 0) {
        query = 'SELECT\
                  users.username,\
                  users.firstname,\
                  users.lastname,\
                  profileIndividual.currentProfession,\
                  profileIndividual.profilepicture,\
                  profileIndividual.location,\
                  profileIndividual.gender,\
                  profileIndividual.demographic,\
                  MATCH (users.username, users.firstname, users.lastname) AGAINST (CONCAT("*", ?, "*") IN BOOLEAN MODE) as uscore,\
                  MATCH (profileIndividual.currentProfession,\
                         profileIndividual.gender,\
                         profileIndividual.demographic,\
                         profileIndividual.location)\
                  AGAINST (CONCAT("*", ?, "*") IN BOOLEAN MODE) as pscore\
                FROM\
                  users\
                INNER JOIN profileIndividual ON users.uid = profileIndividual.fk_uid\
                WHERE (users.accType = "Student" OR users.accType = "Teacher")\
                HAVING uscore+pscore > 0 ORDER BY (uscore+pscore) DESC LIMIT 200;'

        return resolve(mySQL.execute(query, [search, search]))
      }

      // for empty searches
      query = 'SELECT\
                users.username,\
                users.firstname,\
                users.lastname,\
                profileIndividual.currentProfession,\
                profileIndividual.profilepicture,\
                profileIndividual.location,\
                profileIndividual.gender,\
                profileIndividual.demographic\
              FROM\
                users\
              INNER JOIN profileIndividual ON users.uid = profileIndividual.fk_uid\
              ORDER BY users.firstname DESC;'

      return resolve(mySQL.execute(query, []))
    })
  }

  // search for matching employer information
  const employerSearch = () => {
    return new Promise((resolve) => {
      let query

      // for non-empty searches
      if (search.length) {
        query = 'SELECT\
                  users.username,\
                  users.firstname,\
                  users.verified,\
                  profileOrg.logo,\
                  profileOrg.location,\
                  MATCH (users.username, users.firstname, users.lastname) AGAINST (CONCAT("*", ?, "*") IN BOOLEAN MODE) as uscore,\
                  MATCH (profileOrg.location) AGAINST (CONCAT("*", ?, "*") IN BOOLEAN MODE) as pscore\
                FROM\
                  users\
                INNER JOIN profileOrg ON users.uid = profileOrg.fk_uid\
                WHERE (users.accType = "Employer")\
                HAVING uscore+pscore > 0 ORDER BY (uscore+pscore) DESC LIMIT 200;'
        return resolve(mySQL.execute(query, [search, search]))
      }

      // for empty searches
      query = 'SELECT\
                users.username,\
                users.firstname,\
                users.verified,\
                profileOrg.logo,\
                profileOrg.location\
              FROM\
                users\
              INNER JOIN profileOrg ON users.uid = profileOrg.fk_uid\
              ORDER BY users.firstname DESC;'

      return resolve(mySQL.execute(query, []))
    })
  }

  // search for job listings with relevant information
  const jobListingSearch = () => {
    return new Promise((resolve) => {
      let query

      // for non-empty searches
      if (search.length) {
        query = 'SELECT\
                  users.username,\
                  users.firstname,\
                  profileOrg.logo,\
                  jobListing.listing_id,\
                  jobListing.jobTitle,\
                  jobListing.description,\
                  jobListing.expiryDate,\
                  MATCH (users.username, users.firstname, users.lastname) AGAINST (CONCAT("*", ?, "*") IN BOOLEAN MODE) as uscore,\
                  MATCH (jobListing.location, jobListing.jobTitle) AGAINST (CONCAT("*", ?, "*") IN BOOLEAN MODE) as jscore\
                FROM\
                  jobListing\
                INNER JOIN users on jobListing.poster_id = users.uid\
                INNER JOIN profileOrg ON jobListing.poster_id = profileOrg.fk_uid\
                WHERE (jobListing.hidden = 0 AND jobListing.expired = 0)\
                HAVING uscore+jscore > 0 ORDER BY (uscore+jscore) DESC LIMIT 200;'

        return resolve(mySQL.execute(query, [search, search]))
      }

      // for non-empty searches
      query = 'SELECT\
                users.username,\
                users.firstname,\
                profileOrg.logo,\
                jobListing.listing_id,\
                jobListing.jobTitle,\
                jobListing.description,\
                jobListing.expiryDate\
              FROM\
                jobListing\
              INNER JOIN users on jobListing.poster_id = users.uid\
              INNER JOIN profileOrg ON jobListing.poster_id = profileOrg.fk_uid\
              WHERE (jobListing.hidden = 0 AND jobListing.expired = 0)\
              ORDER BY users.firstname DESC;'

      return resolve(mySQL.execute(query, []))
    })
  }

  // search for matching educational background
  const educationSearch = () => {
    return new Promise((resolve) => {
      // education shall not have empty seaches as it is equivalent to a user empty search
      const query = 'SELECT\
                            result_table.username,\
                            result_table.firstname,\
                            result_table.lastname,\
                            result_table.currentProfession,\
                            result_table.profilepicture,\
                            result_table.location,\
                            result_table.gender,\
                            result_table.demographic,\
                            MAX(result_table.escore) AS escore\
                            FROM\
                                (SELECT\
                                    users.username,\
                                    users.firstname,\
                                    users.lastname,\
                                    profileIndividual.currentProfession,\
                                    profileIndividual.profilepicture,\
                                    profileIndividual.location,\
                                    profileIndividual.gender,\
                                    profileIndividual.demographic,\
                                    education.degree_name,\
                                    education.degree_type,\
                                    education.university,\
                                    MATCH (education.degree_name , education.degree_type , education.university) AGAINST (CONCAT("*", ?, "*") IN BOOLEAN MODE) AS escore\
                                FROM\
                                    users\
                                INNER JOIN education ON users.uid = education.fk_uid\
                                INNER JOIN profileIndividual ON users.uid = profileIndividual.fk_uid\
                                HAVING escore > 0\
                                ORDER BY escore DESC\
                                LIMIT 200) AS result_table GROUP BY result_table.username ORDER BY escore DESC LIMIT 200;'

      return resolve(mySQL.execute(query, [search]))
    })
  }

  // conduct search adhering to given filter
  const getSearchResults = () => {
    if (filter === 'Users') {
      return userSearch()
    } else if (filter === 'Employers') {
      return employerSearch()
    } else if (filter === 'Job Listings') {
      return jobListingSearch()
    } else if (filter === 'Education') {
      return educationSearch()
    } else if (filter === 'Unfiltered') {
      // collect user, employer, joblisting, and education results and place them in array of arrays
      const resultsArray = [[], [], [], []]

      // parse mysql user results and add them to the 0th index of the results array
      const userPromise = new Promise((resolve) => {
        userSearch()
          .then((results, fields) => {
            if (results[0].length) {
              for (row of results[0]) {
                resultsArray[0].push(JSON.parse(JSON.stringify(row))) // parse to JSON format
              }
            }
            resolve()
          })
      })

      // parse mysql employer results and add them to the 1st index of the results array
      const employerPromise = new Promise((resolve) => {
        employerSearch()
          .then((results, fields) => {
            if (results[0].length !== 0) {
              for (row of results[0]) {
                resultsArray[1].push(JSON.parse(JSON.stringify(row))) // parse to JSON format
              }
            }
            resolve()
          })
      })

      // parse mysql job listing results and add them to the 2nd index of the results array
      const jobListingPromise = new Promise((resolve) => {
        jobListingSearch()
          .then((results, fields) => {
            if (results[0].length) {
              for (row of results[0]) {
                resultsArray[2].push(JSON.parse(JSON.stringify(row))) // parse to JSON format
              }
            }
            resolve()
          })
      })

      // parse mysql job listing results and add them to the 3rd index of the results array
      const educationPromise = new Promise((resolve) => {
        educationSearch()
          .then((results, fields) => {
            if (results[0].length) {
              for (row of results[0]) {
                resultsArray[3].push(JSON.parse(JSON.stringify(row))) // parse to JSON format
              }
            }
            resolve()
          })
      })

      // wait for promises to be resolved then return array
      return Promise.all([userPromise, employerPromise, jobListingPromise, educationPromise])
        .then(() => { 
          return resultsArray 
        })
    } else {
      throw new SearchError('Invalid filter.', errorAddress, '200')
    }
  }

  validate()
    .then(() => getSearchResults())
    .then((results) => {
      res.locals.results = [filter, []]

      // parse and place results in res.locals.results if filter is not unfiltered
      if (filter !== 'Unfiltered') {
        if (results[0].length) {
          for (row of results[0]) {
            res.locals.results[1].push(JSON.parse(JSON.stringify(row)))
          }
        } else {
          res.locals.results[1].push(0)
        }
      } else {
        // copy array from unfiltered results to res.locals.results
        res.locals.results[1] = results
      }

      res.render('searchResults', { title: req.query.search }) // render search page
    })
    .catch(err => {
      // handle expected search error
      if (err instanceof SearchError) {
        printers.errorPrint(err.getMessage())
        req.flash('error', err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL())
      }

      next(err)
    })
})

module.exports = router
