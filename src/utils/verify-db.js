import dotenv from 'dotenv';
import { connectToDatabase } from './db.js';
import { Admin } from '../models/Admin.js';
import { Student } from '../models/Student.js';
import { Book } from '../models/Book.js';

dotenv.config();

async function verifyAndSeed() {
  try {
    await connectToDatabase();
    console.log('✅ Database connected');

    // Check and create admin
    const adminCount = await Admin.countDocuments();
    console.log(`📊 Found ${adminCount} admins`);
    
    if (adminCount === 0) {
      console.log('🔧 Creating default admin...');
      await Admin.create({
        name: 'Admin',
        email: 'admin@library.com',
        password: 'admin123'
      });
      console.log('✅ Admin created: admin@library.com / admin123');
    } else {
      const admin = await Admin.findOne({ email: 'admin@library.com' });
      if (!admin) {
        await Admin.create({
          name: 'Admin',
          email: 'admin@library.com',
          password: 'admin123'
        });
        console.log('✅ Admin created: admin@library.com / admin123');
      }
    }

    // Check and create students
    const studentCount = await Student.countDocuments();
    console.log(`📊 Found ${studentCount} students`);
    
    if (studentCount === 0) {
      console.log('🔧 Creating default students...');
      await Student.create([
        { 
          name: 'Alice Johnson', 
          enrollmentNumber: 'STU001', 
          password: 'password123',
          rollNumber: '2023CS001',
          branch: 'Computer Science and Engineering',
          session: '2023-2024'
        },
        { 
          name: 'Bob Smith', 
          enrollmentNumber: 'STU002', 
          password: 'password123',
          rollNumber: '2023EE001',
          branch: 'Electrical Engineering',
          session: '2023-2024'
        },
        { 
          name: 'Charlie Brown', 
          enrollmentNumber: 'STU003', 
          password: 'password123',
          rollNumber: '2023ME001',
          branch: 'Mechanical Engineering',
          session: '2023-2024'
        }
      ]);
      console.log('✅ Students created: STU001, STU002, STU003 / password123');
    } else {
      const stu001 = await Student.findOne({ enrollmentNumber: 'STU001' });
      if (!stu001) {
        await Student.create({ 
          name: 'Alice Johnson', 
          enrollmentNumber: 'STU001', 
          password: 'password123',
          rollNumber: '2023CS001',
          branch: 'Computer Science and Engineering',
          session: '2023-2024'
        });
        console.log('✅ Student created: STU001 / password123');
      }
    }

    // Check and create books
    const bookCount = await Book.countDocuments();
    console.log(`📊 Found ${bookCount} books`);
    
    if (bookCount === 0) {
      console.log('🔧 Creating sample books...');
      await Book.create([
        {
          title: 'Clean Code',
          author: 'Robert C. Martin',
          isbn: '9780132350884',
          category: 'Programming',
          quantity: 5,
          available: 5,
          description: 'A Handbook of Agile Software Craftsmanship'
        },
        {
          title: 'The Pragmatic Programmer',
          author: 'Andrew Hunt',
          isbn: '9780135957059',
          category: 'Programming',
          quantity: 3,
          available: 3,
          description: 'Your Journey to Mastery'
        },
        {
          title: 'JavaScript: The Good Parts',
          author: 'Douglas Crockford',
          isbn: '9780596517748',
          category: 'Web Development',
          quantity: 4,
          available: 4,
          description: 'Unearthing the Excellence in JavaScript'
        }
      ]);
      console.log('✅ Books created');
    }

    console.log('\n🎉 Database verification complete!');
    console.log('\n📝 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍💼 ADMIN LOGIN:');
    console.log('   Email: admin@library.com');
    console.log('   Password: admin123');
    console.log('\n🎓 STUDENT LOGIN:');
    console.log('   Enrollment: STU001');
    console.log('   Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyAndSeed();
