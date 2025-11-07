import dotenv from 'dotenv';
import { connectToDatabase } from './db.js';
import { Admin } from '../models/Admin.js';
import { Student } from '../models/Student.js';
import { Book } from '../models/Book.js';

dotenv.config();

async function run() {
  await connectToDatabase();

  const admins = [
    { name: 'Admin One', email: 'admin1@example.com', password: 'password123' },
    { name: 'Admin Two', email: 'admin2@example.com', password: 'password123' },
    { name: 'Admin Three', email: 'admin3@example.com', password: 'password123' },
    { name: 'Admin Four', email: 'admin4@example.com', password: 'password123' },
  ];

  for (const a of admins) {
    const exists = await Admin.findOne({ email: a.email });
    if (!exists) await Admin.create(a);
  }

  const students = [
    { name: 'Alice', enrollmentNumber: 'ENR001', password: 'password123' },
    { name: 'Bob', enrollmentNumber: 'ENR002', password: 'password123' },
  ];

  for (const s of students) {
    const exists = await Student.findOne({ enrollmentNumber: s.enrollmentNumber });
    if (!exists) await Student.create(s);
  }

  const books = [
    { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Programming', quantity: 5, available: 5 },
    { title: 'You Don\'t Know JS', author: 'Kyle Simpson', isbn: '9781491904244', category: 'Programming', quantity: 3, available: 3 },
  ];

  for (const b of books) {
    const exists = await Book.findOne({ isbn: b.isbn });
    if (!exists) await Book.create(b);
  }

  console.log('Seed complete. Admins, students, and books ensured.');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


