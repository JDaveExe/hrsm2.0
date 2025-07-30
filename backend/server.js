require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const { sequelize, connectDB } = require('./config/database');

// Import models
// const User = require('./models/User');
// const Patient = require('./models/Patient');
// const Family = require('./models/Family');

// Define associations
// User.hasOne(Patient, { foreignKey: 'userId' });
// Patient.belongsTo(User, { foreignKey: 'userId' });

// Family associations
// Family.hasMany(Patient, { foreignKey: 'familyId', as: 'members' });
// Patient.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
// connectDB();

// Sync database and create default users
/*
sequelize.sync({ force: false }).then(async () => {
  console.log('Database & tables created!');
  
  // Create default users if they don't exist
  try {
    await User.createDefaultUsers();
    console.log('Default users initialized');
  } catch (error) {
    console.error('Error creating default users:', error);
  }
});
*/

// Routes
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/patients', require('./routes/patients'));
// app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => {
  res.send('Healthcare API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
