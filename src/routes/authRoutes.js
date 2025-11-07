import { Router } from 'express';
import { body } from 'express-validator';
import { adminLogin, studentLogin, logout } from '../controllers/authController.js';

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

export default router;


