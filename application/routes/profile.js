const express = require('express')
const router = express.Router()

const routeProtectors = require('../middleware/route_protectors')
const profileRetriever = require('../middleware/profile_middleware')

/**
 * Render profile
 */
router.get(['/:username', '/'], routeProtectors.allowLoggedUser, profileRetriever.generateProfile, (req, res, next) => {
  let dob = new Date(res.locals.results[0].dateOfBirth) // convert to to date obj
  if (dob) {
    dob = Number(dob.getMonth() + 1).toString().padStart(2, '0') + '/' + dob.getDate().toString().padStart(2, '0') + '/' + dob.getFullYear()
  }

  // render page based on profile state.
  if (!res.locals.results[0].firstname) {
    if (!res.locals.results[0].firstname) {
      res.render('profiles', {
        title: res.locals.results[0].username
      })
    }
  } else if (!res.locals.results[0].lastname) {
    res.render('profiles', {
      title: `${res.locals.results[0].firstname}`
    })
  } else {
    res.render('profiles', {
      title: `${res.locals.results[0].firstname} ${res.locals.results[0].lastname}`
    })
  }
})

module.exports = router
