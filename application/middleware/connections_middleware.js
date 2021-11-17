const mySQL = require('../config/database')
const printers = require('../helpers/debug/DebugAlerts')

const connectionsMiddleware = {}

connectionsMiddleware.generateConnectionsList = (req, res, next) => {
  const uid = req.session.userId
  res.locals.results = []

  // collect student connections
  const collectStudents = () => {
    return new Promise((resolve) => {
      const query = ' SELECT\
                               *\
                            FROM\
                               (SELECT\
                                       users.uid,\
                                       users.username,\
                                       users.email,\
                                       users.firstname,\
                                       users.lastname,\
                                       profileIndividual.currentProfession,\
                                       profileIndividual.profilepicture,\
                                       profileIndividual.location\
                                FROM\
                                   connections\
                                INNER JOIN users ON connections.connected_uid = users.uid\
                                INNER JOIN profileIndividual ON connections.connected_uid = profileIndividual.fk_uid\
                                   AND pending = 0\
                                WHERE\
                                   connections.connector_uid = ? AND users.accType = "student" UNION\
                                SELECT\
                                       users.uid,\
                                       users.username,\
                                       users.email,\
                                       users.firstname,\
                                       users.lastname,\
                                       profileIndividual.currentProfession,\
                                       profileIndividual.profilepicture,\
                                       profileIndividual.location\
                                FROM\
                                   connections\
                                INNER JOIN users ON connections.connector_uid = users.uid\
                                INNER JOIN profileIndividual ON connections.connector_uid = profileIndividual.fk_uid\
                                   AND pending = 0\
                                WHERE\
                                    connections.connected_uid = ? AND users.accType = "student") AS students ORDER BY students.firstname;'

      mySQL.execute(query, [uid, uid])
        .then((results, fields) => {
          if (results && results[0].length > 0) {
            results = results[0]
            res.locals.results[0] = []
            for (const row of results) {
              res.locals.results[0].push(JSON.parse(JSON.stringify(row)))
            }
          } else {
            res.locals.results[0] = 0
          }

          return resolve()
        })
    })
  }

  // collect teacher connections
  const collectTeachers = () => {
    return new Promise((resolve) => {
      const query = ' SELECT\
                                *\
                            FROM\
                                (SELECT\
                                        users.uid,\
                                        users.username,\
                                        users.email,\
                                        users.firstname,\
                                        users.lastname,\
                                        profileIndividual.currentProfession,\
                                        profileIndividual.profilepicture,\
                                        profileIndividual.location\
                                FROM\
                                    connections\
                                INNER JOIN profileIndividual ON connections.connector_uid = profileIndividual.fk_uid\
                                INNER JOIN users ON connections.connector_uid = users.uid\
                                    AND pending = 0\
                                WHERE\
                                    connections.connected_uid = ? AND users.accType = "teacher" UNION\
                                SELECT\
                                        users.uid,\
                                        users.username,\
                                        users.email,\
                                        users.firstname,\
                                        users.lastname,\
                                        profileIndividual.currentProfession,\
                                        profileIndividual.profilepicture,\
                                        profileIndividual.location\
                                FROM\
                                    connections\
                                INNER JOIN profileIndividual ON connections.connected_uid = profileIndividual.fk_uid\
                                INNER JOIN users ON connections.connected_uid = users.uid\
                                    AND pending = 0\
                                WHERE\
                                    connections.connector_uid = ? AND users.accType = "teacher") AS students ORDER BY students.firstname;'

      mySQL.execute(query, [uid, uid])
        .then((results, fields) => {
          console.log(results[0])
          if (results && results[0].length > 0) {
            results = results[0]
            res.locals.results[1] = []
            for (const row of results) {
              res.locals.results[1].push(JSON.parse(JSON.stringify(row)))
            }
          } else {
            res.locals.results[1] = 0
          }

          return resolve()
        })
    })
  }

  // collect employer connections
  const collectEmployers = () => {
    return new Promise((resolve) => {
      const query = ' SELECT\
                               *\
                            FROM\
                                (SELECT\
                                        users.uid,\
                                        users.username,\
                                        users.email,\
                                        users.firstname,\
                                        profileOrg.logo,\
                                        profileOrg.location\
                                FROM\
                                   connections\
                                INNER JOIN profileOrg ON connections.connector_uid = profileOrg.fk_uid\
                                INNER JOIN users ON connections.connector_uid = users.uid\
                                   AND pending = 0\
                                WHERE\
                                   connections.connected_uid = ? AND users.accType = "employer" UNION\
                                SELECT\
                                        users.uid,\
                                        users.username,\
                                        users.email,\
                                        users.firstname,\
                                        profileOrg.logo,\
                                        profileOrg.location\
                                FROM\
                                    connections\
                                INNER JOIN profileOrg ON connections.connected_uid = profileOrg.fk_uid\
                                INNER JOIN users ON connections.connected_uid = users.uid \
                                    AND pending = 0\
                                WHERE\
                                    connections.connector_uid= ? AND users.accType = "employer") AS students ORDER BY students.firstname;'

      mySQL.execute(query, [uid, uid])
        .then((results, fields) => {
          console.log(results[0])
          if (results && results[0].length > 0) {
            results = results[0]
            res.locals.results[2] = []
            for (const row of results) {
              res.locals.results[2].push(JSON.parse(JSON.stringify(row)))
            }
          } else {
            res.locals.results[2] = 0
          }

          return resolve()
        })
    })
  }

  Promise.all([collectStudents(), collectTeachers(), collectEmployers()])
    .then(() => {
      next()
    })
    .catch(err => {
      req.flash('error', 'Server Error. Please try again later.')
      printers.errorPrint('Server Error. Please try again later.')
      res.redirect('/profile')
    })
}

module.exports = connectionsMiddleware
