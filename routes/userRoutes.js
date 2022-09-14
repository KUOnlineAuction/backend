const express = require('express')
const userController = require('./../controllers/userController')
const authController = require('./../controllers/authController')

const router = express.Router();

// Authentication related stuff
router.post('/signup', authController.signup) //done
router.post('/signupnoverify', authController.signupnoverify) //done
router.post('/validateUser/:id', authController.validateUser) //done

router.post('/signin', authController.login) //done
router.post('/signout', authController.signout) //done

router.post('/forgot-password', authController.forgotPassword) // done
router.post('/reset-password', authController.resetPassword) //done


// User related stuff
router.get('/myprofile',authController.protect, userController.myProfile) // done
router.patch('/edit', authController.protect ,userController.editProfle) // done
router.get('/myorder', authController.protect,userController.myorder) // done
router.get('/profile/:id', userController.aucProfile) // done

module.exports = router