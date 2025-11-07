import { Router } from 'express';
import { body } from 'express-validator';
import { adminLogin, studentLogin, logout, resetAdminPassword, resetStudentPassword } from '../controllers/authController.js';

const router = Router();

router.post(
  '/admin/login',
  [body('email').isEmail(), body('password').isString().isLength({ min: 6 })],
  adminLogin
);

router.post(
  '/student/login',
  [body('enrollmentNumber').isString(), body('password').isString().isLength({ min: 6 })],
  studentLogin
);

router.post('/logout', logout);

router.post(
  '/admin/reset-password',
  [
    body('email').isEmail(),
    body('newPassword').isString().isLength({ min: 6 }),
  ],
  resetAdminPassword
);

router.post(
  '/student/reset-password',
  [
    body('enrollmentNumber').isString(),
    body('newPassword').isString().isLength({ min: 6 }),
  ],
  resetStudentPassword
);

export default router;


