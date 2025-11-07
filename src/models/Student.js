import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const borrowedBookSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    borrowDate: { type: Date, default: Date.now },
    returnDate: { type: Date },
    dueDate: { type: Date },
    status: { type: String, enum: ['borrowed', 'returned'], default: 'borrowed' },
    returnedOnTime: { type: Boolean, default: null },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, trim: true },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    enrollmentNumber: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    rollNumber: { type: String, trim: true },
    branch: { 
      type: String,
      enum: [
        'Computer Science and Engineering',
        'Electrical Engineering',
        'Electronics',
        'Civil Engineering',
        'Mechanical Engineering'
      ]
    },
    session: { type: String, trim: true },
    borrowedBooks: [borrowedBookSchema],
    
    // Gamification fields
    points: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ 
      type: String, 
      enum: ['first-book', 'speed-reader', 'genre-explorer', 'review-master', 'on-time-returner', 'bookworm', 'early-bird', 'night-owl'] 
    }],
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: Date }
    },
    
    // Analytics fields
    readingStats: {
      totalBooksRead: { type: Number, default: 0 },
      favoriteGenres: [{ genre: String, count: Number }],
      averageRating: { type: Number, default: 0 },
      booksThisMonth: { type: Number, default: 0 },
      booksThisYear: { type: Number, default: 0 }
    },
    
    // Preferences for recommendations
    preferences: {
      favoriteCategories: [String],
      readingGoal: { type: Number, default: 0 }, // books per month
    }
  },
  { timestamps: true }
);

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

studentSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const Student = mongoose.model('Student', studentSchema);


