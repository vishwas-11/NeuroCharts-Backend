// models/ExcelData.js
const mongoose = require('mongoose');

const ExcelDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Link to the User model
    ref: 'User', // Reference the 'User' model
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  sheetName: {
    type: String,
    required: true,
  },
  headers: {
    type: [String], // Array of strings for column headers
    required: true,
  },
  // 'data' will store the rows of the Excel sheet.
  // Since each row can have dynamic keys (based on headers), we use a mixed type.
  // Mongoose's Mixed type allows for flexible data structures, but it's important
  // to explicitly tell Mongoose when the content of a Mixed type has changed (using .markModified()).
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ExcelData', ExcelDataSchema);

/*
  Explanation for models/ExcelData.js:
  - `userId`: Stores the ID of the user who uploaded the file, creating a relationship with the User model.
  - `fileName`: The original name of the uploaded Excel file.
  - `sheetName`: The name of the specific sheet from which data was parsed (Excel files can have multiple sheets).
  - `headers`: An array of strings representing the column headers from the Excel sheet.
  - `data`: This is the crucial part. It's defined as `mongoose.Schema.Types.Mixed` to allow for flexible JSON objects (rows) where keys correspond to `headers`. Each object in this array will represent a row.
  - `uploadDate`: Automatically records when the data was uploaded.
*/
