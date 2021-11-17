const mySQL = require('../config/database')
const printers = require('../helpers/debug/DebugAlerts')
const UserError = require('../helpers/errors/UserError')

const profileMiddleWare = {}

profileMiddleWare.generateProfile = (req, res, next) => {
  let requestedProfileUserName = req.params.username

  if (requestedProfileUserName == null) {
    requestedProfileUserName = req.session.username
  }

  req.session.reqUserProfile = requestedProfileUserName

  const collectData = () => {
    return new Promise((resolve) => {
      
      const query = 'CALL SkillSeek.getProfileInfo(?);' // mySQL stored procedure
      mySQL.execute(query, [requestedProfileUserName])
        .then((results, fields) => {
        
          if (results && results[0][0].length !== 0) {
            results = JSON.parse(JSON.stringify(results[0][0]))

            const reqAccountType = results[0].accType
            const profileOwnerUid = results[0].uid

            req.session.requestedAccountType = reqAccountType
            res.locals.results = [] // create empty array
            res.locals.results.push(results[0]) // push results

            const dob = new Date(res.locals.results[0].dateOfBirth) // convert to to date obj

            res.locals.results[0].dateOfBirth = `${Number(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getDate().toString().padStart(2, '0')}/${dob.getFullYear()}`

            // get education from education table if teacher or student
            const getEducation = () => {
              return new Promise((resolve) => {
                if (reqAccountType === 'employer') {
                  return resolve()
                }

                const query = 'SELECT * FROM SkillSeek.education WHERE education.fk_uid = ? ORDER BY education.beginDate DESC;'
                mySQL.execute(query, [profileOwnerUid])
                  .then((results, fields) => {
                    
                    res.locals.results[1] = [] // assign empty array
                    
                    if (results && results[0].length) {
                      
                      for (let row of results[0]) { // convert rows to json
                        row = JSON.parse(JSON.stringify(row))

                        let start = new Date(row.beginDate)
                        
                        start = Number(start.getMonth() + 1).toString().padStart(2, '0') + '/'
                        + start.getDate().toString().padStart(2, '0') + '/' + start.getFullYear()
                        
                        row.beginDate = start

                        if (!row.ongoing) {
                          let end = new Date(row.endDate)

                          end = Number(end.getMonth() + 1).toString().padStart(2, '0') + '/'
                          + end.getDate().toString().padStart(2, '0') + '/' + end.getFullYear()

                          row.endDate = end
                        }

                        row.viewerId = res.locals.userId
                        res.locals.results[1].push(row) // push json rows
                      }
                    }
                  
                    return resolve()
                  })
              })
            }

            // get experience from experience table if teacher or student
            const getExperience = () => {
              return new Promise((resolve) => {
                if (reqAccountType === 'employer') {
                  return resolve()
                }
                const query = 'SELECT * FROM SkillSeek.experience WHERE experience.fk_uid = ? ORDER BY experience.beginDate DESC;'
                mySQL.execute(query, [profileOwnerUid])
                  .then((results, fields) => {
                    
                    res.locals.results[2] = [] // assign empty array

                    if (results && results[0].length) {
                      for (let row of results[0]) { // convert rows to json
                        row = JSON.parse(JSON.stringify(row))

                        let start = new Date(row.beginDate)
                        
                        start = Number(start.getMonth() + 1).toString().padStart(2, '0') + '/'
                        + start.getDate().toString().padStart(2, '0') + '/' + start.getFullYear()
                        
                        row.beginDate = start

                        if (!row.onGoing) {
                          let end = new Date(row.endDate)
                          
                          end = Number(end.getMonth() + 1).toString().padStart(2, '0') + '/'
                          + end.getDate().toString().padStart(2, '0') + '/' + end.getFullYear()

                          row.endDate = end
                        }

                        row.viewerId = res.locals.userId
                        res.locals.results[2].push(row) // push json rows
                      }
                    }
                    return resolve()
                  })
              })
            }

            // get rating from rating table if student
            const getRating = () => {
              return new Promise((resolve) => {
                if (reqAccountType === 0) {
                  return resolve()
                }

                const query = 'SELECT\
                                rating.rating_id,\
                                rating.rating,\
                                rating.rated,\
                                rating.rater,\
                                rating.title,\
                                rating.review,\
                                rating.dateRated,\
                                users.firstname,\
                                users.lastname,\
                                users.username,\
                                profileIndividual.profilepicture \
                              FROM\
                                SkillSeek.rating\
                              INNER JOIN SkillSeek.users ON rating.rater = users.uid \
                              INNER JOIN SkillSeek.profileIndividual ON profileIndividual.fk_uid = users.uid\
                              WHERE rating.rated = ? ORDER BY rating.dateRated DESC;'

                mySQL.execute(query, [profileOwnerUid])
                  .then((results, fields) => {
                    res.locals.results[3] = []

                    if (results && results[0].length) { // if ratings exist
                      for (let row of results[0]) { // convert dates
                        row = JSON.parse(JSON.stringify(row))

                        const dateRated = new Date(row.dateRated) // formate dates
                        row.dateRated = `${Number(dateRated.getMonth() + 1).toString().padStart(2, '0')}/${dateRated.getDate().toString().padStart(2, '0')}/${dateRated.getFullYear()}`

                        if (row.profilepicture) {
                          row.profilepicture = '/' + row.profilepicture
                        } else {
                          row.profilepicture = '/public/images/assets/user.png'
                        }

                        row.viewerId = res.locals.userId
                        res.locals.results[3].push(row)
                      }
                    }
                    return resolve()
                  })
              })
            }

            // get job listings if employer profile
            const getJobListings = () => {
              return new Promise((resolve) => {
                if (reqAccountType !== 'employer') {
                  return resolve()
                }
                const query = 'SELECT * FROM SkillSeek.jobListing WHERE poster_id = ? ORDER BY jobListing.expiryDate ASC;'

                mySQL.execute(query, [profileOwnerUid])
                  .then((results, fields) => {
                    res.locals.results[1] = []

                    if (results && results[0].length) {
                      for (let row of results[0]) { // convert dates
                        row = JSON.parse(JSON.stringify(row))

                        const expiryDate = new Date(row.expiryDate) // format date
                        row.dateRated = `${Number(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getDate().toString().padStart(2, '0')}/${expiryDate.getFullYear()}`

                        row.viewerId = req.session.userId // add viewer uid to each row

                        // add accpunt type of viewer to each row
                        if (req.session.isStudent) {
                          row.isStudent = true
                        } else if (req.session.isTeacher) {
                          row.isTeacher = true
                        }

                        res.locals.results[1].push(row)
                      }
                    }

                    if (req.session.isStudent) {
                      const checkAppliedQuery = 'SELECT\
                                                    listing_id\
                                                FROM\
                                                    SkillSeek.jobApplicant\
                                                    WHERE jobApplicant.applicant_uid = ?;'

                      return mySQL.execute(checkAppliedQuery, [req.session.userId])
                    }

                    return resolve()
                  })
                  .then((results, fields) => {
                    if (results) {
                      // iterate through applications submitted by student
                      for (let row of results[0]) {
                        row = JSON.parse(JSON.stringify(row)) // convert to JSON obj

                        // iterate through joblistings on employer profile
                        for (const jobListing of res.locals.results[1]) {
                          // student has applied to job listing
                          if (row.listing_id === jobListing.listing_id) {
                            jobListing.applied = true
                            break
                          }
                        }
                      }
                    }
                    return resolve()
                  })
              })
            }

            // results will be in index 2 for employers and index 4 for other users in res.locals.results
            const checkForConnection = () => {
              return new Promise((resolve) => {
                if (requestedProfileUserName === req.session.user) {
                  if (reqAccountType !== 'employer') {
                    res.locals.results[4] = 0
                  } else {
                    res.locals.results[2] = 0
                  }

                  return resolve()
                } else {
                  const query = 'SELECT\
                                  *\
                                FROM\
                                  SkillSeek.connections\
                                WHERE\
                                  ((connected_uid = ? AND connector_uid = ? AND pending = 0)\
                                  OR (connected_uid = ? AND connector_uid = ?));'

                  mySQL.execute(query, [req.session.userId, profileOwnerUid, profileOwnerUid, req.session.userId])
                    .then((results, fields) => {
                      if (results && results[0][0]) {
                        // connection exists
                        if (reqAccountType !== 'employer') {
                          res.locals.results[4] = 1
                        } else {
                          res.locals.results[2] = 1
                        }
                      } else {
                        // connection does not exist
                        if (reqAccountType !== 'employer') {
                          res.locals.results[4] = 0
                        } else {
                          res.locals.results[2] = 0
                        }
                      }

                      return resolve()
                    })
                }
              })
            }

            Promise.all([getEducation(), getExperience(), getRating(), getJobListings(), checkForConnection()])
              .then(() => {
                return resolve()
              })
              .catch(err => {
                if (err instanceof UserError) {
                  req.flash('error', err.getMessage())
                  res.redirect(err.getRedirectURL())
                }

                printers.errorPrint(err)
                req.flash('error', 'We encountered difficulties finding this page. Sorry for the inconvenience.')
                res.redirect('/')
              })
          } else {
            throw new UserError('Profile does not exist.', '/', 200)
          }
        })
    })
  }

  collectData()
    .then(() => {
      console.log(res.locals.results)
      next()
    })
    .catch(err => console.log(err))
}

// generate user specific edit form
profileMiddleWare.generateEdit = (req, res, next) => {
  let query

  // if student or teacher
  if (req.session.accountType !== 'employer') {
    query = 'SELECT\
                users.firstname,\
                users.lastname,\
                users.dateOfBirth,\
                profileIndividual.currentProfession,\
                profileIndividual.gender,\
                profileIndividual.demographic,\
                profileIndividual.description,\
                profileIndividual.profilepicture,\
                profileIndividual.resume,\
                profileIndividual.location \
              FROM\
                SkillSeek.users\
              INNER JOIN SkillSeek.profileIndividual ON uid = fk_uid\
              WHERE users.uid = ?;'

    mySQL.execute(query, [req.session.userId])
      .then((results, fields) => {
        res.locals.results = results[0][0]
        next()
      })
      .catch(err => {
        printers.errorPrint(err)
        next(err)
      })
  } else {
    query = 'SELECT\
              users.firstname,\
              users.dateOfBirth,\
              profileOrg.description,\
              profileOrg.logo,\
              profileOrg.location\
            FROM\
              SkillSeek.users\
            INNER JOIN SkillSeek.profileOrg ON uid = fk_uid\
            WHERE users.uid = ?;'

    mySQL.execute(query, [req.session.userId])
      .then((results, fields) => {
        res.locals.results = results[0][0]
        next()
      })
      .catch(err => {
        printers.errorPrint(err)
        next(err)
      })
  }
}

module.exports = profileMiddleWare
