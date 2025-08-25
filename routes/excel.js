// const express = require('express');
// const router = express.Router();
// const multer = require('multer'); // For handling file uploads
// const xlsx = require('xlsx'); // For parsing Excel files
// const ExcelData = require('../models/ExcelData'); // Our new ExcelData model
// const { protect, authorizeAdmin } = require('../middleware/authMiddleware'); // Import authentication middleware

// // Configure Multer for file storage
// const storage = multer.memoryStorage(); // Store file in memory as a Buffer
// const upload = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     // Accept only Excel file types
//     if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only Excel files (.xls, .xlsx) are allowed!'), false);
//     }
//   },
//   limits: {
//     fileSize: 1024 * 1024 * 5 // 5 MB file size limit
//   }
// });

// // @route   POST /api/excel/upload
// // @desc    Upload and parse an Excel file, then store data
// // @access  Private (requires authentication)
// router.post('/upload', protect, upload.single('excelFile'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file uploaded.' });
//   }

//   try {
//     const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];
//     const jsonRows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

//     if (jsonRows.length === 0) {
//       return res.status(400).json({ message: 'Excel file is empty or could not be parsed.' });
//     }

//     const headers = jsonRows[0];
//     const dataRows = jsonRows.slice(1);

//     const structuredData = dataRows.map(row => {
//       const rowObject = {};
//       headers.forEach((header, index) => {
//         rowObject[header] = row[index];
//       });
//       return rowObject;
//     });

//     const newExcelData = new ExcelData({
//       userId: req.user.id,
//       fileName: req.file.originalname,
//       sheetName: sheetName,
//       headers: headers,
//       data: structuredData,
//     });

//     await newExcelData.save();

//     res.status(201).json({
//       message: 'File uploaded and data stored successfully!',
//       dataId: newExcelData._id,
//       fileName: newExcelData.fileName,
//       sheetName: newExcelData.sheetName,
//       headers: newExcelData.headers,
//       sampleData: structuredData.slice(0, 5)
//     });

//   } catch (error) {
//     console.error('Error uploading or parsing Excel file:', error);
//     if (error.message.includes('Only Excel files')) {
//       return res.status(400).json({ message: error.message });
//     }
//     res.status(500).json({ message: 'Server error during file upload or parsing.' });
//   }
// });

// // @route   GET /api/excel/history
// // @desc    Get upload history for the authenticated user (or all files for admin/superadmin)
// // @access  Private
// router.get('/history', protect, async (req, res) => {
//   try {
//     let query = { userId: req.user.id };
    
//     if (req.user.role === 'admin' || req.user.role === 'superadmin') {
//       query = {};
//     }

//     // UPDATED: Populate the userId field with the username
//     const history = await ExcelData.find(query)
//       .select('fileName sheetName uploadDate headers userId')
//       .populate('userId', 'username') // Only populate the 'username' field from the User model
//       .sort({ uploadDate: -1 });

//     res.status(200).json({
//       message: 'Upload history retrieved successfully!',
//       history: history,
//     });
//   } catch (error) {
//     console.error('Error fetching upload history:', error);
//     res.status(500).json({ message: 'Server error fetching upload history.' });
//   }
// });

// // @route   GET /api/excel/:id
// // @desc    Get a specific Excel data entry by ID
// // @access  Private
// router.get('/:id', protect, async (req, res) => {
//   try {
//     // UPDATED: Populate the userId field with the username
//     const dataEntry = await ExcelData.findOne({ _id: req.params.id })
//       .populate('userId', 'username');

//     if (!dataEntry) {
//       return res.status(404).json({ message: 'Data entry not found.' });
//     }
    
//     if (dataEntry.userId._id.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
//       return res.status(403).json({ message: 'You do not have access to view this file.' });
//     }

//     res.status(200).json({
//       message: 'Data entry retrieved successfully!',
//       data: dataEntry,
//     });
//   } catch (error) {
//     console.error('Error fetching specific data entry:', error);
//     res.status(500).json({ message: 'Server error fetching data entry.' });
//   }
// });

// // @route   DELETE /api/excel/:id
// // @desc    Delete a specific Excel data entry by ID
// // @access  Private
// router.delete('/:id', protect, async (req, res) => {
//   try {
//     // UPDATED: Allow admin/superadmin to delete any file
//     const dataEntry = await ExcelData.findOne({ _id: req.params.id });

//     if (!dataEntry) {
//       return res.status(404).json({ message: 'Data entry not found or you do not have access.' });
//     }
    
//     // Check if the user has permission to delete the file
//     if (dataEntry.userId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
//       return res.status(403).json({ message: 'You do not have the permission to delete this file.' });
//     }

//     await dataEntry.deleteOne();

//     res.status(200).json({
//       message: 'File deleted successfully!',
//       dataId: req.params.id,
//     });
//   } catch (error) {
//     console.error('Error deleting file:', error);
//     res.status(500).json({ message: 'Server error deleting file.' });
//   }
// });

// module.exports = router;





// routes/excel.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const ExcelData = require('../models/ExcelData');
const { protect } = require('../middleware/authMiddleware');
// FIXED: Correctly import fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); 

// NEW: Use the API key from the .env file
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Configure Multer for file storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xls, .xlsx) are allowed!'), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5
  }
});

// @route   POST /api/excel/upload
// @desc    Upload and parse an Excel file, then store data
// @access  Private (requires authentication)
router.post('/upload', protect, upload.single('excelFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonRows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonRows.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty or could not be parsed.' });
    }

    const headers = jsonRows[0];
    const dataRows = jsonRows.slice(1);

    const structuredData = dataRows.map(row => {
      const rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = row[index];
      });
      return rowObject;
    });

    const newExcelData = new ExcelData({
      userId: req.user.id,
      fileName: req.file.originalname,
      sheetName: sheetName,
      headers: headers,
      data: structuredData,
    });

    await newExcelData.save();

    res.status(201).json({
      message: 'File uploaded and data stored successfully!',
      dataId: newExcelData._id,
      fileName: newExcelData.fileName,
      sheetName: newExcelData.sheetName,
      headers: newExcelData.headers,
      sampleData: structuredData.slice(0, 5)
    });

  } catch (error) {
    console.error('Error uploading or parsing Excel file:', error);
    if (error.message.includes('Only Excel files')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during file upload or parsing.' });
  }
});

// @route   GET /api/excel/history
// @desc    Get upload history for the authenticated user (or all files for admin/superadmin)
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    let query = { userId: req.user.id };
    
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      query = {};
    }

    const history = await ExcelData.find(query)
      .select('fileName sheetName uploadDate headers userId')
      .populate('userId', 'username')
      .sort({ uploadDate: -1 });

    res.status(200).json({
      message: 'Upload history retrieved successfully!',
      history: history,
    });
  } catch (error) {
    console.error('Error fetching upload history:', error);
    res.status(500).json({ message: 'Server error fetching upload history.' });
  }
});

// @route   GET /api/excel/:id
// @desc    Get a specific Excel data entry by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const dataEntry = await ExcelData.findOne({ _id: req.params.id });

    if (!dataEntry) {
      return res.status(404).json({ message: 'Data entry not found.' });
    }
    
    if (dataEntry.userId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'You do not have access to view this file.' });
    }

    res.status(200).json({
      message: 'Data entry retrieved successfully!',
      data: dataEntry,
    });
  } catch (error) {
    console.error('Error fetching specific data entry:', error);
    res.status(500).json({ message: 'Server error fetching data entry.' });
  }
});

// @route   DELETE /api/excel/:id
// @desc    Delete a specific Excel data entry by ID
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const dataEntry = await ExcelData.findOne({ _id: req.params.id });

    if (!dataEntry) {
      return res.status(404).json({ message: 'Data entry not found or you do not have access.' });
    }
    
    if (dataEntry.userId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'You do not have the permission to delete this file.' });
    }

    await dataEntry.deleteOne();

    res.status(200).json({
      message: 'File deleted successfully!',
      dataId: req.params.id,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Server error deleting file.' });
  }
});

// NEW ROUTE: Get AI Insights
// @route   POST /api/excel/insights
// @desc    Get AI-powered insights from Excel data
// @access  Private
router.post('/insights', protect, async (req, res) => {
  const { fileId, prompt } = req.body;
  if (!fileId || !prompt) {
    return res.status(400).json({ message: 'File ID and prompt are required.' });
  }

  try {
    const dataEntry = await ExcelData.findOne({ _id: fileId });

    if (!dataEntry) {
      return res.status(404).json({ message: 'Data entry not found.' });
    }

    // Check if the user has permission to view the file
    if (dataEntry.userId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'You do not have access to this file.' });
    }

    // Prepare data for the prompt
    const dataToSend = JSON.stringify(dataEntry.data);
    const fullPrompt = `You are a data analyst. Analyze the following JSON data: ${dataToSend}. Based on the data, provide a professional and detailed response to the following query: "${prompt}".`;

    const payload = {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {}
    };
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    let response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
    }

    let result = await response.json();
    const aiResponse = result.candidates[0].content.parts[0].text;

    res.status(200).json({
      message: 'AI insights generated successfully!',
      aiResponse: aiResponse,
    });

  } catch (error) {
    console.error('Error getting AI insights:', error);
    res.status(500).json({ message: 'Server error getting AI insights.' });
  }
});

module.exports = router;
