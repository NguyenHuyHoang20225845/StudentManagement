// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB - ĐƠN GIẢN HÓA
mongoose.connect('mongodb://localhost:27017/student_db')
  .then(() => {
    console.log("✅ Đã kết nối MongoDB thành công");
    console.log("📊 Database: student_db");
    console.log("🔌 Port: 27017");
  })
  .catch(err => {
    console.error("❌ Lỗi kết nối MongoDB:", err.message);
    console.log("📌 Kiểm tra:");
    console.log("   1. Docker container có đang chạy? (docker ps)");
    console.log("   2. MongoDB có trên port 27017?");
    
    // Vẫn chạy server dù không có MongoDB (cho dev)
    console.log("⚠️  Server vẫn chạy nhưng không có database");
  });

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Student Management API đang chạy!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    endpoints: {
      home: 'GET /',
      getStudents: 'GET /api/students',
      addStudent: 'POST /api/students',
      updateStudent: 'PUT /api/students/:id',
      deleteStudent: 'DELETE /api/students/:id'
    }
  });
});

// Tạo model Student đơn giản (trong memory nếu MongoDB không hoạt động)
let students = [
  { _id: '1', name: 'Nguyễn Văn A', age: 15, class: '10A1' },
  { _id: '2', name: 'Trần Thị B', age: 16, class: '10A2' }
];

// GET all students
app.get('/api/students', (req, res) => {
  console.log('📥 GET /api/students');
  
  // Nếu MongoDB kết nối, dùng database
  if (mongoose.connection.readyState === 1) {
    // Import model
    const Student = require('./models/Student');
    
    Student.find()
      .then(data => res.json(data))
      .catch(err => {
        console.error('❌ Lỗi lấy danh sách từ MongoDB:', err);
        res.json(students); // Fallback to memory
      });
  } else {
    // Dùng dữ liệu trong memory
    res.json(students);
  }
});

// POST new student
app.post('/api/students', async (req, res) => {
  console.log('📥 POST /api/students');
  console.log('📦 Body:', req.body);
  
  const { name, age, class: className } = req.body;
  
  // Validation
  if (!name || !age || !className) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng nhập đầy đủ thông tin (tên, tuổi, lớp)'
    });
  }
  
  const ageNum = Number(age);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
    return res.status(400).json({
      success: false,
      error: 'Tuổi phải là số từ 1 đến 100'
    });
  }
  
  try {
    let newStudent;
    
    // Nếu MongoDB kết nối
    if (mongoose.connection.readyState === 1) {
      const Student = require('./models/Student');
      
      newStudent = await Student.create({
        name: name.trim(),
        age: ageNum,
        class: className.trim()
      });
      
      console.log('✅ Đã lưu vào MongoDB:', newStudent);
    } else {
      // Dùng memory
      newStudent = {
        _id: Date.now().toString(),
        name: name.trim(),
        age: ageNum,
        class: className.trim(),
        createdAt: new Date()
      };
      
      students.push(newStudent);
      console.log('✅ Đã thêm vào memory:', newStudent);
    }
    
    res.status(201).json({
      success: true,
      message: 'Thêm học sinh thành công',
      data: newStudent
    });
    
  } catch (err) {
    console.error('❌ Lỗi khi thêm học sinh:', err);
    
    res.status(500).json({
      success: false,
      error: 'Không thể thêm học sinh',
      message: err.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint không tồn tại: ${req.method} ${req.originalUrl}`,
    available: [
      'GET /',
      'GET /api/students',
      'POST /api/students'
    ]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`🏠 Homepage: http://localhost:${PORT}/`);
  console.log(`📚 API Students: http://localhost:${PORT}/api/students`);
  console.log(`📡 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ⚠️'}`);
  console.log('\n📌 Test commands:');
  console.log(`   curl http://localhost:${PORT}/api/students`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/students \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"name":"Test","age":15,"class":"10A1"}'`);
});