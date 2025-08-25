// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const authRoutes = require('./routes/auth');
// const excelRoutes = require('./routes/excel');
// const adminRoutes = require('./routes/admin'); // NEW: Import admin routes

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.json());

// const mongoURI = process.env.MONGO_URI;

// mongoose.connect(mongoURI)
//   .then(() => console.log('MongoDB connected successfully!'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/excel', excelRoutes);
// app.use('/api/admin', adminRoutes); // NEW: Use the admin routes

// app.get('/', (req, res) => {
//   res.send('Excel Analytics Platform Backend is running!');
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });





// app.js
// This is the main entry point for your backend Express application.

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const excelRoutes = require('./routes/excel');
const adminRoutes = require('./routes/admin'); // NEW: Import admin routes

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/admin', adminRoutes); // NEW: Use the admin routes

app.get('/', (req, res) => {
  res.send('Excel Analytics Platform Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
