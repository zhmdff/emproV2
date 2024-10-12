const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

const app = express();

// Session setup
app.use(session({
  secret: 'Oy76kSAqMV3N1jEO9TENnyWrDiFf67CO',
  resave: false,
  saveUninitialized: true
}));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'website', 'src')));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Use routes
app.use(authRoutes);
app.use(dashboardRoutes);
app.use(studentRoutes);
app.use(adminRoutes);
app.use(teacherRoutes);



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
