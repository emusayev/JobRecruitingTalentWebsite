const printers = require('../helpers/debug/DebugAlerts')

const routeprotectors = {}

routeprotectors.allowLoggedUser = (req, res, next) => {
  if (req.session.username) {
    printers.successPrint('User is logged in.')
    next()
  } else {
    printers.errorPrint('User is not logged in.')
    req.flash('error', 'You must login to access this page.')
    res.redirect('/login')
  }
}

routeprotectors.allowUnloggedUser = (req, res, next) => {
  if (!req.session.username) {
    printers.successPrint('User is not logged in.')
    next()
  } else {
    printers.errorPrint('User is already logged in.')
    req.flash('error', 'You must be logged out to access this page.')
    res.redirect('/')
  }
}

routeprotectors.userSpecificAccess = (req, res, next) => {
  if (req.session.username && (req.session.reqUserProfile === req.session.username)) {
    printers.successPrint('User access to restricted space granted.')
    next()
  } else {
    req.flash('error', 'Access to restricted area denied.')
    printers.errorPrint('Access to restricted area denied.')
    res.redirect('/')
  }
}

routeprotectors.employerAccountTypeAccess = (req, res, next) => {
  if (req.session.isEmployer) {
    printers.successPrint('Employer access granted.')
    next()
  } else {
    printers.errorPrint(`${req.session.accountType} access to employer area denied.`)
    req.flash('error', 'Are you lost?')
    res.redirect('/')
  }
}

routeprotectors.nonEmployerAccountTypeAccess = (req, res, next) => {
  if (!req.session.isEmployer) {
    printers.successPrint(`${req.session.accountType} access granted.`)
    next()
  } else {
    printers.errorPrint('Employer access to student/teacher area denied.')
    req.flash('error', 'Are you lost?')
    res.redirect('/')
  }
}

module.exports = routeprotectors
