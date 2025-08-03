const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db'); // Initialize database connection

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Basic home route for testing
app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));