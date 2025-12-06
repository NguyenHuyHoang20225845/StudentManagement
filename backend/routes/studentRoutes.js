// backend/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// GET all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ 
      error: 'Lỗi khi lấy danh sách học sinh', 
      message: err.message 
    });
  }
});

// POST new student
router.post('/', async (req, res) => {
  console.log("📥 POST /api/students - Request body:", req.body);
  
  try {
    const { name, age, class: className } = req.body;
    
    if (!name || !age || !className) {
      return res.status(400).json({ 
        error: 'Vui lòng nhập đầy đủ thông tin' 
      });
    }

    const newStudent = await Student.create({
      name: name.trim(),
      age: Number(age),
      class: className.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Thêm học sinh thành công',
      data: newStudent
    });
    
  } catch (err) {
    console.error("❌ Lỗi:", err);
    res.status(400).json({ 
      success: false,
      error: 'Không thể thêm học sinh',
      message: err.message 
    });
  }
});

module.exports = router;