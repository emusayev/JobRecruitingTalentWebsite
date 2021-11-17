const express = require('express')
const router = express.Router()

const mySQL = require('../config/database')
const routeprotectors = require('../middleware/route_protectors')
const UserError = require('../helpers/errors/UserError')
const printers = require('../helpers/debug/DebugAlerts')

const transporterPool = require('../config/transporter')
const emailCredentials = require('../config/email.json')
const connectionsMiddleware = require('../middleware/connections_middleware')

const mailOptions = {
  from: emailCredentials.email,
  to: '',
  subject: 'You have recieved a new connection request!',
  text: ''
}

router.get('/connections', routeprotectors.allowLoggedUser, connectionsMiddleware.generateConnectionsList, (req, res, next) => {
  res.render('connections', { title: 'Connections' })
})

/**
 * Create a connection between two users. Effectively granting users the ability to view
 * each others' email address for direct communication.
 * Connection to students and teachers requires them to accept.
 * Connection to employers are automatically accepted.
 */
router.post('/add', routeprotectors.allowLoggedUser, (req, res, next) => {
  const connectedUid = req.body.userid // user recieving request
  const connectorUid = req.session.userId // user sending request
  const redirectURL = req.body.redirectURL // Redirect in case of error or success
  let connectedAccType

  const checkExistingConnection = 'SELECT\
                                        connections_id\
                                     FROM\
                                        connections\
                                     WHERE\
                                        (connected_uid = ? AND connector_uid = ?)\
                                        OR (connected_uid = ? AND connector_uid = ?);'

  const createConnectionUser = 'INSERT INTO SkillSeek.connections\
                                    (connector_uid, connected_uid)\
                                  VALUES\
                                    (?, ?);'

  const createConnectionEmployer = 'INSERT INTO SkillSeek.connections\
                                        (connector_uid, connected_uid, pending)\
                                      VALUES\
                                        (?, ?, 0);'

  const getUserInfo = 'SELECT accType, email FROM users WHERE uid = ?;'

  // check if connection request has already been made
  mySQL.execute(checkExistingConnection, [connectedUid, connectorUid, connectorUid, connectedUid])
    .then((results, fields) => {
      if (results && results[0].length === 0) {
        return mySQL.execute(getUserInfo, [connectedUid])
      } else if (results && results[0].length > 0) {
        throw new UserError('Connection has already been established.', redirectURL, 200)
      } else {
        throw new UserError('Server Error. Please try again later.', redirectURL, 200)
      }
    })
    .then((results, fields) => {
      // send email to student or teacher to ensure they wish to accept the request
      connectedAccType = results[0][0].accType

      if (results && results[0].length === 1 && connectedAccType !== 'Employer') {
        mailOptions.to = results[0][0].email

        mailOptions.html = `<h3>You have recieved a new connection request from the user: ${req.session.username}!</h3>\
            <h4>Accept the request by using the following button:</h4>\
            <form action = 'https://skillseek.ga/connect/accept' method = 'GET' enctype="application/x-www-form-urlencoded">\
            <input type = 'hidden' name = 'connected_uid' value = ${connectedUid}>\
            <input type = 'hidden' name = 'connector_uid' value = ${connectorUid}>\
            <input type = 'submit' value = 'Accept' style= 'background:none; border-width: 0px; color: #00B7FF; text-decoration: underline;'/>
            </form>\
            <h4>You may also use the following link: <a href = "https://skillseek.ga/connect/accept?connected_uid=${connectedUid}&connector_uid=${connectorUid}">https://skillseek.ga/connect/?connected_uid=${connectedUid}&connector_uid=${connectorUid}</a></h4>
            <h4>Sincerly,<br>The SkillSeek Team</h4>`

        return new Promise((resolve) => {
          transporterPool.sendMail(mailOptions, (err, info) => {
            if (err) {
              console.error(err)
              throw new UserError('Connection request could not be sent.', redirectURL, 200)
            }
            resolve()
          })
        })
      } else if (results && results[0].length == 1) {
        return Promise.resolve()
      } else {
        throw new UserError('The user you are trying to connect to does not exist.', redirectURL, 200)
      }
    })
    .then(() => {
      // establish connection by creating entry in connection table
      if (connectedAccType !== 'Employer') {
        return mySQL.execute(createConnectionUser, [connectorUid, connectedUid])
      } else {
        return mySQL.execute(createConnectionEmployer, [connectorUid, connectedUid])
      }
    })
    .then(() => {
      req.flash('success', 'Connection request has been sent.')
      printers.successPrint(`Connection request has been sent to ${connectedUid}.`)
      res.redirect(redirectURL)
    })
    .catch(err => {
      if (err instanceof UserError) {
        req.flash('error', err.getMessage())
        res.status(err.getStatus())
        res.redirect(err.getRedirectURL())
      }
    })
})

/**
 * Delete connection between two users.
 */
router.post('/delete', routeprotectors.allowLoggedUser, (req, res, next) => {
  const deleterUid = req.session.userId
  const deletedUid = req.body.userid
  const redirectURL = req.body.redirectURL

  const query = 'DELETE FROM SkillSeek.connections\
                   WHERE\
                       (connected_uid = ? AND connector_uid = ?)\
                       OR (connected_uid = ? AND connector_uid = ?);'

  // check db for existing connection two users.
  mySQL.execute(query, [deletedUid, deleterUid, deleterUid, deletedUid])
    .then((results, fields) => {
      // if no connection exists
      if (results[0].affectedRows === 0) {
        req.flash('error', 'No existing connection with the user.')
        printers.successPrint(`No connection exists between ${deleterUid} and ${deletedUid}.`)
        res.redirect(redirectURL)
      }

      // if connection exists
      req.flash('success', 'Connection has been deleted.')
      printers.successPrint(`Connection deleted between ${deleterUid} and ${deletedUid}.`)
      res.redirect(redirectURL)
    })
    .catch(err => {
      req.flash('Server Error. Please try again later.')
      printers.errorPrint(`Connection could not be deleted between ${deleterUid} and ${deletedUid}.`)
      res.redirect(redirectURL)
    })
})

/**
 * Accept connection request from email.
 */
router.get('/accept', routeprotectors.allowLoggedUser, (req, res, next) => {
  const connectorUid = req.query.connector_uid
  const connectedUid = req.query.connected_uid

  const query = 'UPDATE SkillSeek.connections\
                   SET\
                       pending = 0\
                   WHERE\
                       connector_uid = ? AND connected_uid = ?;'

  mySQL.execute(query, [connectorUid, connectedUid])
    .then((results, fields) => {
      req.flash('success', 'Connection has been established.')
      printers.successPrint(`Connection established between ${connectorUid} and ${connectedUid}.`)
      res.redirect('/')
    })
    .catch((results, fields) => {
      req.flash('Server Error. Please try again later.')
      printers.errorPrint(`Connection could not be established between ${connectorUid} and ${connectedUid}.`)
      res.redirect('/')
    })
})

module.exports = router
