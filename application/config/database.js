const mySQL = require('mysql2')

const {
  host,
  user,
  password,
  database,
  port
} = require('./db.json')

const pool = mySQL.createPool({
  connectionLimit: 50,
  host: host,
  user: user,
  password: password,
  database: database,
  port: port,
  supportBigNumbers: true,
  bigNumberStrings: true
})

const promisePool = pool.promise()

module.exports = promisePool
