import { Book } from '../models/Book.js';
import { Student } from '../models/Student.js';

/**
 * Get personalized book recommendations for a student
 */
export async function getRecommendations(studentId, limit = 10) {
  const student = await Student.findById(studentId).populate('borrowedBooks.bookId');
  if (!student) return [];

  // Get student's reading history
  const borrowedBooks = student.borrowedBooks.filter(b => b.bookId);
  
  // Extract categories from borrowed books
  const categoryMap = new Map();
  borrowedBooks.forEach(b => {
    const category = b.bookId.category;
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });

  // Sort categories by frequency
  const topCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  // Get books student hasn't borrowed
  const borrowedBookIds = borrowedBooks.map(b => b.bookId._id.toString());

  // Build recommendation query
  let recommendations = [];

  // 1. Books from favorite categories (60% weight)
  if (topCategories.length > 0) {
    const categoryBooks = await Book.find({
      _id: { $nin: borrowedBookIds },
      category: { $in: topCategories },
      available: { $gt: 0 }
    })
      .sort({ 'ratings.average': -1, totalBorrows: -1 })
      .limit(Math.ceil(limit * 0.6));

    recommendations.push(...categoryBooks);
  }

  // 2. Trending/Popular books (30% weight)
  const remainingSlots = limit - recommendations.length;
  if (remainingSlots > 0) {
    const trendingBooks = await Book.find({
      _id: { $nin: [...borrowedBookIds, ...recommendations.map(b => b._id.toString())] },
      available: { $gt: 0 }
    })
      .sort({ totalBorrows: -1, 'ratings.average': -1 })
      .limit(Math.ceil(remainingSlots * 0.75));

    recommendations.push(...trendingBooks);
  }

  // 3. Highly rated books from other genres (10% weight)
  const finalSlots = limit - recommendations.length;
  if (finalSlots > 0) {
    const highlyRated = await Book.find({
      _id: { $nin: [...borrowedBookIds, ...recommendations.map(b => b._id.toString())] },
      available: { $gt: 0 },
      'ratings.average': { $gte: 4 }
    })
      .sort({ 'ratings.average': -1 })
      .limit(finalSlots);

    recommendations.push(...highlyRated);
  }

  return recommendations.slice(0, limit).map(book => ({
    ...book.toObject(),
    reason: getRecommendationReason(book, topCategories, borrowedBooks)
  }));
}

/**
 * Get recommendation reason
 */
function getRecommendationReason(book, favoriteCategories, borrowedBooks) {
  if (favoriteCategories.includes(book.category)) {
    return `Because you enjoy ${book.category} books`;
  }
  
  if (book.totalBorrows > 50) {
    return 'Popular choice among students';
  }
  
  if (book.ratings.average >= 4.5) {
    return 'Highly rated by readers';
  }
  
  return 'You might enjoy this';
}

/**
 * Get similar books based on a specific book
 */
export async function getSimilarBooks(bookId, limit = 5) {
  const book = await Book.findById(bookId);
  if (!book) return [];

  // Find books in same category or by same author
  const similarBooks = await Book.find({
    _id: { $ne: bookId },
    $or: [
      { category: book.category },
      { author: book.author }
    ],
    available: { $gt: 0 }
  })
    .sort({ 'ratings.average': -1, totalBorrows: -1 })
    .limit(limit);

  return similarBooks;
}

/**
 * Get trending books
 */
export async function getTrendingBooks(limit = 10, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const trending = await Book.find({
    available: { $gt: 0 },
    updatedAt: { $gte: cutoffDate }
  })
    .sort({ totalBorrows: -1, 'ratings.average': -1 })
    .limit(limit);

  return trending;
}

/**
 * Update book statistics after borrow/return
 */
export async function updateBookStats(bookId, action, rating = null) {
  const book = await Book.findById(bookId);
  if (!book) return null;

  if (action === 'borrow') {
    book.totalBorrows += 1;
    book.currentlyBorrowed += 1;
    book.available -= 1;
  } else if (action === 'return') {
    book.currentlyBorrowed -= 1;
    book.available += 1;
  }

  // Update rating if provided
  if (rating && rating >= 1 && rating <= 5) {
    const currentTotal = book.ratings.average * book.ratings.count;
    book.ratings.count += 1;
    book.ratings.average = (currentTotal + rating) / book.ratings.count;
  }

  // Mark as trending if borrowed frequently
  book.trending = book.totalBorrows > 20 && book.currentlyBorrowed > 2;

  await book.save();
  return book;
}
