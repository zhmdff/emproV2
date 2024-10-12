const express = require('express');
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/student/form', authMiddleware, studentController.getStudentForm);
// router.post('/student-form', authMiddleware, studentController.submitStudentForm);
router.get('/student/table', authMiddleware, studentController.getStudentTable);
router.get('/group/table', authMiddleware, studentController.getGroupTable);
router.get('/group/info/:group_number', authMiddleware, studentController.getGroupInfo);

module.exports = router;
