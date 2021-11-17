const nodeMailer = require('nodemailer')
const emailCredentials = require('../config/email.json')

const transporterPool = nodeMailer.createTransport({
  pool: true,
  maxConnections: 50,
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: emailCredentials.email,
    pass: emailCredentials.password
  }
})

module.exports = transporterPool
