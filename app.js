// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const authRoutes = require('./routes/auth');
// const excelRoutes = require('./routes/excel');
// const adminRoutes = require('./routes/admin'); // NEW: Import admin routes

// const app = express();
// const PORT = process.env.PORT || 3000;

// const corsOptions = {
//   origin: ['http://localhost:3000', 'https://neuro-charts-frontend.vercel.app/'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// };

// app.use(cors(corsOptions)); // <-- use the configured CORS

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






require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const excelRoutes = require('./routes/excel');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// --- UPDATE: Explicit CORS Setup ---
const frontendUrl = 'https://neuro-charts-frontend.vercel.app'; // <-- Change this to your deployed frontend URL

const corsOptions = {
  origin: [frontendUrl, 'http://localhost:3000'], // Allow both deployed and local frontend during testing
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json());

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Excel Analytics Platform Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
