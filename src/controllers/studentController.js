import { validationResult } from 'express-validator';
import { Student } from '../models/Student.js';
import { Book } from '../models/Book.js';
import { updateStreak, checkAndAwardBadges, getLeaderboard, BADGES } from '../services/gamification.js';
import { getRecommendations, getSimilarBooks, getTrendingBooks } from '../services/recommendations.js';

export async function getBorrowedBooks(req, res) {
  const { id } = req.params;
  const student = await Student.findById(id).populate('borrowedBooks.bookId');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student.borrowedBooks);
}

export async function updatePassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { id } = req.params;
  const { password } = req.body;
  const student = await Student.findById(id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  student.password = password;
  await student.save();
  res.json({ message: 'Password updated' });
}

export async function getStudentStats(req, res) {
  const { id } = req.params;
  const student = await Student.findById(id).populate('borrowedBooks.bookId');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  
  const borrowed = student.borrowedBooks.filter((b) => b.status === 'borrowed').length;
  const total = student.borrowedBooks.length;
  
  // Calculate additional stats
  const returnedOnTime = student.borrowedBooks.filter(b => b.returnedOnTime === true).length;
  const averageRating = student.readingStats.averageRating || 0;
  
  // Get favorite genres
  const genreCounts = {};
  student.borrowedBooks.forEach(b => {
    if (b.bookId && b.bookId.category) {
      genreCounts[b.bookId.category] = (genreCounts[b.bookId.category] || 0) + 1;
    }
  });
  
  const favoriteGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre, count]) => ({ genre, count }));
  
  res.json({ 
    borrowed, 
    total,
    returnedOnTime,
    averageRating: averageRating.toFixed(1),
    favoriteGenres,
    points: student.points,
    level: student.level,
    streak: student.streak,
    badges: student.badges,
    readingStats: student.readingStats
  });
}

// Get personalized recommendations
export async function getStudentRecommendations(req, res) {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const recommendations = await getRecommendations(id, limit);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommendations', error: error.message });
  }
}

// Get trending books
export async function getTrending(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;
    
    const trending = await getTrendingBooks(limit, days);
    res.json(trending);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trending books', error: error.message });
  }
}

// Rate a book
export async function rateBook(req, res) {
  try {
    const { id, bookId } = req.params;
    const { rating, review } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    // Find the borrowed book
    const borrowedBook = student.borrowedBooks.find(
      b => b.bookId.toString() === bookId && b.status === 'returned'
    );
    
    if (!borrowedBook) {
      return res.status(404).json({ message: 'Book not found in your history or not yet returned' });
    }
    
    borrowedBook.rating = rating;
    if (review) borrowedBook.review = review;
    
    // Update book's average rating
    const book = await Book.findById(bookId);
    if (book) {
      const currentTotal = book.ratings.average * book.ratings.count;
      book.ratings.count += 1;
      book.ratings.average = (currentTotal + rating) / book.ratings.count;
      await book.save();
    }
    
    // Update student's average rating
    const allRatings = student.borrowedBooks.filter(b => b.rating).map(b => b.rating);
    student.readingStats.averageRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      : 0;
    
    await student.save();
    
    // Check for new badges
    const newBadges = await checkAndAwardBadges(id);
    
    res.json({ 
      message: 'Rating submitted successfully',
      rating: borrowedBook.rating,
      review: borrowedBook.review,
      newBadges
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting rating', error: error.message });
  }
}

// Get leaderboard
export async function getGlobalLeaderboard(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || 'points'; // 'points' or 'books'
    
    const leaderboard = await getLeaderboard(limit, type);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
}

// Get all badges and their descriptions
export async function getBadgesInfo(req, res) {
  res.json(BADGES);
}

// Update streak (called when student performs any activity)
export async function updateStudentStreak(req, res) {
  try {
    const { id } = req.params;
    const streak = await updateStreak(id);
    
    if (!streak) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(streak);
  } catch (error) {
    res.status(500).json({ message: 'Error updating streak', error: error.message });
  }
}


