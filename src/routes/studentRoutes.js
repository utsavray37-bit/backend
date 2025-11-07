import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { 
  getBorrowedBooks, 
  updatePassword, 
  getStudentStats,
  getStudentRecommendations,
  getTrending,
  rateBook,
  getGlobalLeaderboard,
  getBadgesInfo,
  updateStudentStreak
} from '../controllers/studentController.js';

const router = Router();

router.use(requireAuth('student'));

router.get('/borrowed-books/:id', [param('id').isString()], getBorrowedBooks);

router.put(
  '/update-password/:id',
  [param('id').isString(), body('password').isString().isLength({ min: 6 })],
  updatePassword
);

router.get('/stats/:id', [param('id').isString()], getStudentStats);

// Recommendations
router.get('/recommendations/:id', [param('id').isString()], getStudentRecommendations);

// Trending books
router.get('/trending', getTrending);

// Rate a book
router.post(
  '/rate/:id/:bookId',
  [
    param('id').isString(),
    param('bookId').isString(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('review').optional().isString()
  ],
  rateBook
);

// Leaderboard
router.get('/leaderboard', getGlobalLeaderboard);

// Badges info
router.get('/badges', getBadgesInfo);

// Update streak
router.post('/streak/:id', [param('id').isString()], updateStudentStreak);

export default router;


