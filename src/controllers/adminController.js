import { validationResult } from 'express-validator';
import { Book } from '../models/Book.js';
import { Student } from '../models/Student.js';
import { Admin } from '../models/Admin.js';
import { awardPoints, updateStreak, checkAndAwardBadges } from '../services/gamification.js';
import { updateBookStats } from '../services/recommendations.js';

export async function addBook(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { title, author, isbn, category, quantity } = req.body;
  const available = quantity;
  const existing = await Book.findOne({ isbn });
  if (existing) return res.status(400).json({ message: 'Book with this ISBN already exists' });
  const book = await Book.create({ title, author, isbn, category, quantity, available });
  res.status(201).json(book);
}

export async function listBooks(req, res) {
  const books = await Book.find({}).sort({ createdAt: -1 });
  res.json(books);
}

export async function updateBook(req, res) {
  const { id } = req.params;
  const update = req.body;
  const book = await Book.findByIdAndUpdate(id, update, { new: true });
  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json(book);
}

export async function deleteBook(req, res) {
  const { id } = req.params;
  const book = await Book.findByIdAndDelete(id);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json({ message: 'Book deleted' });
}

export async function borrowBook(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { enrollmentNumber, isbn, returnDate } = req.body;

  const student = await Student.findOne({ enrollmentNumber });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const book = await Book.findOne({ isbn });
  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (book.available <= 0) return res.status(400).json({ message: 'No copies available' });

  // Calculate due date (14 days from now if not specified)
  const dueDate = returnDate ? new Date(returnDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  student.borrowedBooks.push({ bookId: book._id, dueDate, returnDate: null });
  
  // Update book stats
  await updateBookStats(book._id, 'borrow');
  
  // Award points and update streak
  await awardPoints(student._id, 'BORROW_BOOK');
  await updateStreak(student._id);
  
  await student.save();
  
  // Check for new badges
  const newBadges = await checkAndAwardBadges(student._id);
  
  res.json({ 
    message: 'Book borrowed', 
    student,
    newBadges: newBadges.length > 0 ? newBadges : undefined
  });
}

export async function returnBook(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { enrollmentNumber, isbn } = req.body;

  const student = await Student.findOne({ enrollmentNumber });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const book = await Book.findOne({ isbn });
  if (!book) return res.status(404).json({ message: 'Book not found' });

  const entry = student.borrowedBooks.find(
    (b) => b.bookId.toString() === book._id.toString() && b.status === 'borrowed'
  );
  if (!entry) return res.status(400).json({ message: 'No borrowed record found' });

  entry.status = 'returned';
  const now = new Date();
  entry.returnDate = now;
  
  // Check if returned on time
  const wasOnTime = entry.dueDate ? now <= new Date(entry.dueDate) : true;
  entry.returnedOnTime = wasOnTime;
  
  // Update book stats
  await updateBookStats(book._id, 'return');
  
  // Award points based on return timing
  if (wasOnTime) {
    const daysEarly = entry.dueDate 
      ? Math.floor((new Date(entry.dueDate) - now) / (1000 * 60 * 60 * 24))
      : 0;
    
    if (daysEarly > 3) {
      await awardPoints(student._id, 'RETURN_EARLY');
    } else {
      await awardPoints(student._id, 'RETURN_ON_TIME');
    }
  } else {
    await awardPoints(student._id, 'LATE_RETURN');
  }
  
  // Update reading stats
  student.readingStats.totalBooksRead += 1;
  student.readingStats.booksThisMonth += 1;
  student.readingStats.booksThisYear += 1;
  
  await student.save();
  
  // Check for new badges
  const newBadges = await checkAndAwardBadges(student._id);
  
  res.json({ 
    message: 'Book returned', 
    student,
    wasOnTime,
    newBadges: newBadges.length > 0 ? newBadges : undefined
  });
}

export async function listBorrowed(req, res) {
  const students = await Student.find({ 'borrowedBooks.0': { $exists: true } })
    .populate('borrowedBooks.bookId')
    .select('name enrollmentNumber borrowedBooks');
  res.json(students);
}

export async function listStudents(req, res) {
  const students = await Student.find({}).select('-password');
  res.json(students);
}

export async function getStats(req, res) {
  const [books, students, admins, borrowed] = await Promise.all([
    Book.countDocuments(),
    Student.countDocuments(),
    Admin.countDocuments(),
    Student.aggregate([
      { $unwind: '$borrowedBooks' },
      { $match: { 'borrowedBooks.status': 'borrowed' } },
      { $count: 'count' },
    ]),
  ]);
  res.json({
    books,
    students,
    admins,
    borrowed: borrowed[0]?.count || 0,
  });
}

export async function addStudent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { name, enrollmentNumber, password, rollNumber, branch, session } = req.body;
  
  // Check if enrollment number already exists
  const existing = await Student.findOne({ enrollmentNumber });
  if (existing) {
    return res.status(400).json({ message: 'Enrollment number already exists' });
  }
  
  const student = await Student.create({ 
    name, 
    enrollmentNumber, 
    password,
    rollNumber,
    branch,
    session
  });
  
  res.status(201).json({
    message: 'Student added successfully',
    student: {
      id: student._id,
      name: student.name,
      enrollmentNumber: student.enrollmentNumber,
      rollNumber: student.rollNumber,
      branch: student.branch,
      session: student.session
    }
  });
}

export async function deleteStudent(req, res) {
  const { id } = req.params;
  const student = await Student.findById(id);
  
  if (!student) return res.status(404).json({ message: 'Student not found' });
  
  // Check if student has borrowed books
  const hasBorrowedBooks = student.borrowedBooks.some(b => b.status === 'borrowed');
  if (hasBorrowedBooks) {
    return res.status(400).json({ message: 'Cannot delete student with borrowed books' });
  }
  
  await Student.findByIdAndDelete(id);
  res.json({ message: 'Student deleted successfully' });
}


