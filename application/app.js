const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const handlebars = require('express-handlebars')
const flash = require('express-flash')

const Sessions = require('express-session')
const MySQLSession = require('express-mysql-session')(Sessions)

const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const profileRouter = require('./routes/profile')
const editRouter = require('./routes/edit')
const experienceRouter = require('./routes/experience')
const rateRouter = require('./routes/rate')
const educationRouter = require('./routes/education')
const jobListingRouter = require('./routes/joblisting')
const connectRouter = require('./routes/connect')
const verificationRouter = require('./routes/verify')
const searchRouter = require('./routes/search')
const recoveryRouter = require('./routes/recover')

const termination = require('./config/termination') // import graceful termination. executes on process kill.
const printers = require('./helpers/debug/DebugAlerts')

const app = express()

app.engine('hbs',
  handlebars({
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    extname: '.hbs',
    defaultLayout: 'layout',
    helpers: {
      emptyObj: (obj) => {
        return !(obj.constructor === Object && Object.keys(obj).length === 0) // is an object type and has no keys return false
      },
      equals: (obj, checkAgainst) => {
        return (obj == checkAgainst)
      },
      and: function () { // check if all items exist hbs (2 or more args)
        if (arguments.length > 2) {
          let bool = ((typeof arguments[0] !== undefined) && (typeof arguments[1] !== undefined))

          if (arguments.length > 3) {
            for (let i = 2; i < arguments.length - 1; i++) {
              bool = bool && (typeof arguments[i] !== undefined)
            }
          }
          return bool
        }
        return false
      },
      or: function () { // check if one of all items exists (2 or more args)
        if (arguments.length > 2) {
          let bool = (!(arguments[0] == undefined) || !(arguments[1] == undefined))
          if (arguments.length > 3) {
            for (let i = 2; i < arguments.length - 1; i++) {
              bool = bool || !(typeof arguments[i] === undefined)
            }
          }
          return bool
        }
        return false
      }
    }
  })
)

const mySQLSessionStore = new MySQLSession({}, require('./config/database')) // store sessions in mySQL

app.enable('trust proxy')
app.disable('x-powered-by')
app.use(Sessions({
  key: 'csid',
  secret: 'CSC648-TEAM01',
  store: mySQLSessionStore,
  cookie: { secure: true, maxAge: 3600000, httpOnly: true },
  resave: false,
  saveUninitialized: false
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

app.use(flash())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
// app.use('/public', express.static(path.join(__dirname, 'public')));

// log requests
app.use((req, res, next) => {
  printers.requestPrint(req.url)
  next()
})

// set locals
app.use((req, res, next) => {
  if (req.session.username) {
    res.locals.logged = true
    res.locals.user = req.session.username
    res.locals.userId = req.session.userId

    if (req.session.isEmployer) {
      res.locals.isEmployer = true
    } else if (req.session.isTeacher) {
      res.locals.isTeacher = true
    } else {
      res.locals.isStudent = true
    }
  }
  	next()
})

// for test enviornment
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' // due to self-signed certificate

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/profile', profileRouter)
app.use('/edit', editRouter)
app.use('/experience', experienceRouter)
app.use('/rate', rateRouter)
app.use('/education', educationRouter)
app.use('/listing', jobListingRouter)
app.use('/connect', connectRouter)
app.use('/verify', verificationRouter)
app.use('/search', searchRouter)
app.use('/recovery', recoveryRouter)

// error handler
app.use((err, req, res, next) => {
  printers.errorPrint(err)
  res.render('error', { err_message: err })
})

app.use('/public/*', (req, res) => {
  // res.render('error', { err_message: 'Not found.' })
  res.status(404).send('Not Found.')
})

// check for non-existent routes
app.use((req, res) => {
  req.flash('error', 'The requested page does not exist.')
  res.redirect('/')
})

module.exports = app
