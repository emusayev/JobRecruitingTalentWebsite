const express = require('express')
const router = express.Router()

const listingMiddleware = require('../middleware/listing_middleware')
const routeProtectors = require('../middleware/route_protectors')

/* GET home page. */
router.get('/', listingMiddleware.generateMostRecent, (req, res, next) => {
  res.render('index', { title: 'Home' })
})

/**
 * Render verification page
 */
router.get('/verification', (req, res, next) => {
  res.render('verify', { title: 'Email Verification' })
})

router.get('/test', (req, res, next) => {
  res.render('test', { title: 'Test Page' })
})

router.get('/testForm', (req, res, next) => {
  res.render('test', { title: 'Test Form Page' })
})

/**
 * Render Profile
 * ===================================================================================
 */
router.get('/ramzi', (req, res, next) => {
  res.render('portfolio/ramziabouchahine/page', { title: 'Meet The Developers' })
})

router.get('/emin', (req, res, next) => {
  res.render('portfolio/eminmusayev/page', { title: 'Meet The Developers' })
})

router.get('/begum', (req, res, next) => {
  res.render('portfolio/begumsakin/page', { title: 'Meet The Developers' })
})

router.get('/melissa', (req, res, next) => {
  res.render('portfolio/melissagonzalez/page', { title: 'Meet The Developers' })
})

router.get('/ali', (req, res, next) => {
  res.render('portfolio/alibinsabir/page', { title: 'Meet The Developers' })
})
//====================================================================================

// protected routes

/**
 * Render login page
 */
router.get('/login', routeProtectors.allowUnloggedUser, (req, res, next) => {
  res.render('login', { title: 'Login' })
})

/**
 * Render registration page
 */
router.get('/register', routeProtectors.allowUnloggedUser, (req, res, next) => {
  res.render('registration', { title: 'Welcome' })
})

module.exports = router
