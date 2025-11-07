import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    available: { type: Number, required: true, min: 0 },
    
    // Enhanced fields for features
    description: { type: String, trim: true },
    coverImage: { type: String, trim: true },
    publicationYear: { type: Number },
    
    // Rating and review stats
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },
    
    // Popularity metrics
    totalBorrows: { type: Number, default: 0 },
    currentlyBorrowed: { type: Number, default: 0 },
    trending: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Book = mongoose.model('Book', bookSchema);


