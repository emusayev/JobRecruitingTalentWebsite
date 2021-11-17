const promisePool = require('./database')
const transporterPool = require('./transporter')

process.once('SIGINT', () => { // CTRL + C termination
  console.log('Releasing transporter pool.')
  console.log('Releasing mySQL promise pool.')
  transporterPool.close()
  promisePool.end()
    .then(() => {
      process.kill(process.pid, 'SIGTERM')
    })
})

process.once('SIGUSR2', () => { // nodemon restart
  console.log('Releasing transporter pool.')
  console.log('Releasing mySQL promise pool.')
  transporterPool.close()
  promisePool.end()
    .then(() => {
      process.kill(process.pid, 'SIGUSR2')
    })
})

module.exports = this
