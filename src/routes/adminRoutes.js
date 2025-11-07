import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import {
  addBook,
  listBooks,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
  listBorrowed,
  listStudents,
  getStats,
  addStudent,
  deleteStudent,
} from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth('admin'));

router.post(
  '/add-book',
  [
    body('title').isString().notEmpty(),
    body('author').isString().notEmpty(),
    body('isbn').isString().notEmpty(),
    body('category').isString().notEmpty(),
    body('quantity').isInt({ min: 0 }),
  ],
  addBook
);

router.get('/books', listBooks);

router.put('/update-book/:id', [param('id').isString()], updateBook);
router.delete('/delete-book/:id', [param('id').isString()], deleteBook);

router.post(
  '/borrow-book',
  [
    body('enrollmentNumber').isString().notEmpty(),
    body('isbn').isString().notEmpty(),
    body('returnDate').optional().isISO8601(),
  ],
  borrowBook
);

router.post(
  '/return-book',
  [body('enrollmentNumber').isString().notEmpty(), body('isbn').isString().notEmpty()],
  returnBook
);

router.get('/all-borrowed', listBorrowed);
router.get('/students', listStudents);
router.get('/stats', getStats);

router.post(
  '/students',
  [
    body('name').isString().trim().notEmpty(),
    body('enrollmentNumber').isString().trim().notEmpty(),
    body('password').isString().isLength({ min: 6 }),
  ],
  addStudent
);

router.delete('/students/:id', [param('id').isString()], deleteStudent);

export default router;


