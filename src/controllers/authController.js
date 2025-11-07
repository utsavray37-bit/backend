import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { Admin } from '../models/Admin.js';
import { Student } from '../models/Student.js';
import { setAuthCookie } from '../middleware/auth.js';

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function adminLogin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await admin.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken({ id: admin._id, role: 'admin' });
  setAuthCookie(res, token);
  res.json({ token, user: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' } });
}

export async function studentLogin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { enrollmentNumber, password } = req.body;
  const student = await Student.findOne({ enrollmentNumber });
  if (!student) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await student.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken({ id: student._id, role: 'student' });
  setAuthCookie(res, token);
  res.json({ token, user: { id: student._id, name: student.name, enrollmentNumber: student.enrollmentNumber, role: 'student' } });
}

export async function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}


