import dotenv from 'dotenv';
import { connectToDatabase } from './db.js';
import { Admin } from '../models/Admin.js';
import { Student } from '../models/Student.js';
import { Book } from '../models/Book.js';

dotenv.config();

async function run() {
  await connectToDatabase();
  const adminCount = await Admin.countDocuments();
  const studentCount = await Student.countDocuments();
  const bookCount = await Book.countDocuments();
  const oneAdmin = await Admin.findOne({}, { email: 1, name: 1 }).lean();
  console.log('Counts =>', { adminCount, studentCount, bookCount });
  console.log('Sample admin =>', oneAdmin);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


