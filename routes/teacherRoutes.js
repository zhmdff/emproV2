// routes/adminRoutes.js
const express = require('express');
const teacherController = require('../controllers/teacherController');
const router = express.Router();

// Middleware to check user type
const teacherMiddleware = (req, res, next) => {
  if (['teacher'].includes(req.session.userType)) {
    next(); // User type is valid, proceed
  } else {
    res.status(403).send('Access forbidden'); // User type not allowed
  }
};
router.get('/groups', teacherMiddleware, teacherController.getGroupTable);

module.exports = router;
