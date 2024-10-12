// routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware'); // Import your middleware
const path = require('path');
const router = express.Router();

// Redirect root to login
router.get('/', (req, res) => {
  res.redirect('/login');
});


router.get('/login', (req, res) => {
  res.render('login', {req, errorMessage: req.session.errorMessage });
});

router.post('/form-login', authController.login);




router.get('/admin_login', (req, res) => {
  res.render('admin_login', {req, errorMessage: req.session.errorMessage });
});

router.post('/admin-login', authController.admin_login);




// Logout route
router.get('/logout', authController.logout);

// Apply authentication middleware for protected routes
router.use(authMiddleware); // This will apply the middleware to all routes below this line

// Example of a correct route setup
router.get('/dashboard', authMiddleware, dashboardController.dashboard);


// Export the router
module.exports = router;
