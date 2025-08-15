require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize, connectDB } = require('./config/database');
const dbProtection = require('./utils/databaseProtection');

// Import models with associations already defined
const { User, Patient, Family, VitalSigns } = require('./models');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5000'],
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: false, // To allow resources to be loaded from different origins
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database with protection
const initializeServer = async () => {
  try {
    await connectDB();
    
    // Initialize database protection
    await dbProtection.initializeDatabase();
    
    // Sync database without altering existing tables
    await sequelize.sync({ alter: false });
    console.log('Database connected - tables synchronized');
    
    // Create default users if they don't exist
    try {
      await User.createDefaultUsers();
      console.log('Default users initialized');
    } catch (error) {
      console.error('Error creating default users:', error);
    }
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
};

// Initialize server
initializeServer();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/families', require('./routes/families'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/vital-signs', require('./routes/vitalSigns'));
app.use('/api/inventory', require('./routes/inventory'));

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const status = await dbProtection.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a direct route for debugging
app.get('/api/debug/check', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API is responding correctly',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('Healthcare API is running...');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ 
    message: 'Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
