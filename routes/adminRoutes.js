// routes/adminRoutes.js
const express = require('express');
const adminController = require('../controllers/adminController');
const router = express.Router();

// Middleware to check user type
const adminMiddleware = (req, res, next) => {
  if (['admin'].includes(req.session.userType)) {
    next();
  } else {
    res.status(403).send('Access forbidden');
  }
};

router.get('/admin/student/form', adminMiddleware, adminController.studentForm);
router.post('/admin/student/add', adminMiddleware, adminController.studentAdd);
router.get('/admin/group/table', adminMiddleware, adminController.groupTable);
router.get('/admin/group/info/:group_number', adminMiddleware, adminController.groupInfo);
router.get('/admin/group/manage/:group_number', adminMiddleware, adminController.groupManage);
router.post('/admin/group/manage/update/:group_number', adminMiddleware, adminController.groupManageUpdate);
router.get('/admin/group/form', adminMiddleware, adminController.groupForm);
router.post('/admin/group/add', adminMiddleware, adminController.groupAdd);


router.get('/admin/lesson/table', adminMiddleware, adminController.lessonTable);
router.get('/admin/lesson/form', adminMiddleware, adminController.lessonForm);
router.post('/admin/lesson/add', adminMiddleware, adminController.lessonAdd);

module.exports = router;
