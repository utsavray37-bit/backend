import { Student } from '../models/Student.js';

// Points system
const POINTS = {
  BORROW_BOOK: 10,
  RETURN_ON_TIME: 20,
  RETURN_EARLY: 30,
  WRITE_REVIEW: 15,
  COMPLETE_BOOK: 25,
  MAINTAIN_STREAK: 5,
  LATE_RETURN: -10,
};

// Level thresholds
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

// Badge criteria
export const BADGES = {
  'first-book': { name: '📚 First Book', description: 'Borrowed your first book' },
  'speed-reader': { name: '⚡ Speed Reader', description: 'Read 5 books in a month' },
  'genre-explorer': { name: '🌍 Genre Explorer', description: 'Read books from 5 different genres' },
  'review-master': { name: '✍️ Review Master', description: 'Written 10 reviews' },
  'on-time-returner': { name: '⏰ On-Time Champion', description: 'Returned 10 books on time' },
  'bookworm': { name: '🐛 Bookworm', description: 'Read 50 books total' },
  'early-bird': { name: '🌅 Early Bird', description: 'Borrow books before 10 AM' },
  'night-owl': { name: '🦉 Night Owl', description: 'Return books after 8 PM' },
};

/**
 * Award points to a student
 */
export async function awardPoints(studentId, pointType, multiplier = 1) {
  const student = await Student.findById(studentId);
  if (!student) return null;

  const points = POINTS[pointType] * multiplier;
  student.points += points;

  // Update level
  const newLevel = calculateLevel(student.points);
  if (newLevel > student.level) {
    student.level = newLevel;
  }

  await student.save();
  return { points, newLevel: student.level, totalPoints: student.points };
}

/**
 * Calculate level based on points
 */
function calculateLevel(points) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Check and award badges
 */
export async function checkAndAwardBadges(studentId) {
  const student = await Student.findById(studentId).populate('borrowedBooks.bookId');
  if (!student) return [];

  const newBadges = [];

  // First Book Badge
  if (student.borrowedBooks.length === 1 && !student.badges.includes('first-book')) {
    student.badges.push('first-book');
    newBadges.push('first-book');
  }

  // Bookworm Badge
  const totalRead = student.readingStats.totalBooksRead;
  if (totalRead >= 50 && !student.badges.includes('bookworm')) {
    student.badges.push('bookworm');
    newBadges.push('bookworm');
  }

  // Speed Reader Badge
  if (student.readingStats.booksThisMonth >= 5 && !student.badges.includes('speed-reader')) {
    student.badges.push('speed-reader');
    newBadges.push('speed-reader');
  }

  // Genre Explorer Badge
  const uniqueGenres = new Set(
    student.borrowedBooks
      .filter(b => b.bookId && b.bookId.category)
      .map(b => b.bookId.category)
  );
  if (uniqueGenres.size >= 5 && !student.badges.includes('genre-explorer')) {
    student.badges.push('genre-explorer');
    newBadges.push('genre-explorer');
  }

  // Review Master Badge
  const reviewCount = student.borrowedBooks.filter(b => b.review).length;
  if (reviewCount >= 10 && !student.badges.includes('review-master')) {
    student.badges.push('review-master');
    newBadges.push('review-master');
  }

  // On-Time Returner Badge
  const onTimeReturns = student.borrowedBooks.filter(b => b.returnedOnTime === true).length;
  if (onTimeReturns >= 10 && !student.badges.includes('on-time-returner')) {
    student.badges.push('on-time-returner');
    newBadges.push('on-time-returner');
  }

  if (newBadges.length > 0) {
    await student.save();
  }

  return newBadges;
}

/**
 * Update reading streak
 */
export async function updateStreak(studentId) {
  const student = await Student.findById(studentId);
  if (!student) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = student.streak.lastActiveDate 
    ? new Date(student.streak.lastActiveDate) 
    : null;

  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no change
      return student.streak;
    } else if (daysDiff === 1) {
      // Consecutive day, increase streak
      student.streak.current += 1;
      if (student.streak.current > student.streak.longest) {
        student.streak.longest = student.streak.current;
      }
    } else {
      // Streak broken
      student.streak.current = 1;
    }
  } else {
    // First activity
    student.streak.current = 1;
    student.streak.longest = 1;
  }

  student.streak.lastActiveDate = today;
  await student.save();

  // Award streak points
  if (student.streak.current > 1) {
    await awardPoints(studentId, 'MAINTAIN_STREAK', student.streak.current);
  }

  return student.streak;
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(limit = 10, type = 'points') {
  const sortField = type === 'points' ? '-points' : '-readingStats.totalBooksRead';
  
  const leaders = await Student.find()
    .select('name enrollmentNumber points level badges readingStats.totalBooksRead streak')
    .sort(sortField)
    .limit(limit);

  return leaders.map((student, index) => ({
    rank: index + 1,
    name: student.name,
    enrollmentNumber: student.enrollmentNumber,
    points: student.points,
    level: student.level,
    badges: student.badges.length,
    booksRead: student.readingStats.totalBooksRead,
    currentStreak: student.streak.current,
  }));
}
