const express = require('express')
const userController = require('./../controllers/userController')
const authController = require('./../controllers/authController')

const router = express.Router();

// Authentication related stuff
router.post('/signup', authController.signup) //done
router.post('/validateUser/:id', authController.validateUser) //done

router.post('/signin', authController.login) //done
router.post('/signout', authController.signout) //done

router.post('/forgot-password', authController.forgotPassword) // done
router.post('/reset-password', authController.resetPassword) //done


// User related stuff
router.get('/profile/:id', userController.profile) //half way
// router.get('/edit', userController.) // hasnt started
router.get('/test', userController.test)


module.exports = router