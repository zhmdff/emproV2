const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getAdminDashboard = (req, res) => {
    const username = req.session.username || '';

    if (username) {
        // Remove session and redirect to admin_login
        req.session.destroy(err => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).send('Error ending session');
            }
            return res.redirect('/admin_login'); // Adjust the path as needed
        });
    } else {
        req.session.username = username;
        req.session.userType = userType;
    }

    // Render admin_login page
    res.render('admin_login', { username, req, path: req.path, globalUserType: userType });
};


exports.studentForm = (req, res) => {
    
    const sql = 'SELECT * FROM groups';
    db.query(sql, (err, rows) => {
    if (err) {
        return res.status(500).send('Error fetching data from database');
    }
    const username = req.session.username;
    const userType = req.session.userType;
    res.render('student_form', { info: rows, username, req, path: req.path, globalUserType: userType });
    });

};

exports.studentAdd = (req, res) => {
    
    const { name, surname, username, password, email, phone_number, address, group_name, birthdate, course,education_type } = req.body;
    console.log(birthdate)
  
    if (!name || !surname || !username || !password || !email || !phone_number || !address || !group_name || !birthdate || !course || !education_type) {
        console.log(req.body);
        return res.status(400).send('All fields are required 2');
    }
  
    function formatDate(birthdate) {
      const dateObj = new Date(birthdate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  
    // Convert birthdate to YYYY-MM-DD format
    const formattedBirthdate = formatDate(birthdate);
  
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send('Error hashing password');
        }
  
        const sql = 'INSERT INTO students (name, surname, username, password, email, phone_number, address_line, group_name, birthdate, course, education_type, userType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "student")';
        db.query(sql, [name, surname, username, hashedPassword, email, phone_number, address, group_name, formattedBirthdate, course, education_type], (err, result) => {
            if (err) {
              console.log(err)
                return res.status(500).send('Error inserting form data into database');
            }
            console.log('Form data inserted into database');
            res.redirect('/student/table');
        });
    });

};

exports.groupTable = (req, res) => {

    const sql = 'SELECT * FROM groups';

    db.query(sql, (err, rows) => {
    if (err) {
        return res.status(500).send('Error fetching data from database');
    }
        res.render('group_table', { info: rows, username: req.session.username, req, path: req.path, globalUserType: req.session.userType });
    });

};

exports.groupInfo = (req, res) => {
    
    const groupNumber = req.params.group_number;

    const sql = 'SELECT * FROM students WHERE group_name = ?';

    db.query(sql, [groupNumber], (err, rows) => {
      if (err) {
        console.error('Error fetching students:', err);
        return res.status(500).send('Error fetching students');
      }

      res.render('student_list', { info: rows, username: req.session.username, req, path: req.path, userType: req.session.userType });
    });

};

exports.groupManage = (req, res) => {
    const groupNumber = req.params.group_number;

    // Sanitize the table name to prevent SQL injection
    const tableName = groupNumber.replace(/[^a-zA-Z0-9_]/g, '');

    // Define the SQL queries
    const sql2 = `SELECT * FROM \`${tableName}\``; // Query for the dynamic table
    const sql = 'SELECT * FROM students WHERE group_name = ? LIMIT 1'; // Query for the students table

    // Use Promise.all to run both queries simultaneously
    Promise.all([
        new Promise((resolve, reject) => {
            db.query(sql2, (err, rows) => {
                if (err) return reject(err);
                resolve(rows); // Resolve with the result
            });
        }),
        new Promise((resolve, reject) => {
            db.query(sql, [groupNumber], (err, rows) => {
                if (err) return reject(err);
                resolve(rows.length > 0 ? rows[0] : null); // Resolve with the first row or null
            });
        })
    ])
    .then(([dynamicData, studentData]) => {
        // Check if student data was found
        if (!studentData) {
            return res.status(404).send('No students found for this group');
        }

        // Render the view with both datasets
        res.render('group_manage_form', {
            data: dynamicData,
            info: studentData,
            username: req.session.username,
            req,
            path: req.path,
            globalUserType: req.session.userType
        });
    })
    .catch(err => {
        console.error('Error fetching data:', err);
        return res.status(500).send('Error fetching data');
    });
};




exports.groupForm = (req, res) => {
    
    const sql = 'SELECT * FROM groups';
    db.query(sql, (err, rows) => {
      if (err) {
        return res.status(500).send('Error fetching data from database');
      }

      res.render('group_form', { info: rows, username: req.session.username , req, path: req.path, globalUserType: req.session.userType  });
    });

};


exports.groupAdd = (req, res) => {
    const { name, number } = req.body;

    // Sanitize the table name to prevent SQL injection
    const tableName = number.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Create the table using the number as the name
    const sqlCreateTable = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT PRIMARY KEY AUTO_INCREMENT,
            lesson VARCHAR(255),
            teacher VARCHAR(100),
            course INT(5),
            semester INT(5)
        )
    `;
    
    // Check for required fields
    if (!name || !number) {
        return res.status(400).send('All fields are required');
    }

    // Assuming you have a database connection object `db`
    db.query(sqlCreateTable, (err) => {
        if (err) {
            console.error(err); // Log the error for debugging
            return res.status(500).send('Error creating table');
        }
        console.log(`Table '${tableName}' created or already exists.`);
        
        // Insert the group details into the groups table
        const sqlInsert = 'INSERT INTO groups (group_name, group_number) VALUES (?, ?)';
        
        db.query(sqlInsert, [name, number], (err, result) => {
            if (err) {
                console.error(err); // Log the error for debugging
                return res.status(500).send('Error inserting form data into database');
            }
            console.log('Form data inserted into database');
            res.redirect('/admin/group/table');
        });
    });
};



exports.lessonTable = (req, res) => {

    const sql = 'SELECT * FROM lessons';

    db.query(sql, (err, rows) => {
    if (err) {
        return res.status(500).send('Error fetching data from database');
    }
        res.render('lesson_table', { info: rows, username: req.session.username, req, path: req.path, globalUserType: req.session.userType });
    });

};

exports.lessonForm = (req, res) => {
    
    const sql = 'SELECT * FROM lessons';
    db.query(sql, (err, rows) => {
      if (err) {
        return res.status(500).send('Error fetching data from database');
      }

      res.render('lesson_form', { info: rows, username: req.session.username , req, path: req.path, globalUserType: req.session.userType  });
    });

};

exports.lessonAdd = (req, res) => {
    
    const { lesson_name, lesson_faculty, lesson_course } = req.body;

    if (!lesson_name || !lesson_faculty || !lesson_course) {
      return res.status(400).send('All fields are required 3');
    }
  
    const sql = 'INSERT INTO lessons (lesson_name, lesson_faculty, lesson_course) VALUES (?, ?, ?)';
    db.query(sql, [lesson_name, lesson_faculty,lesson_course], (err, result) => {
      if (err) {
        console.error(err); // Log the error for debugging
        return res.status(500).send('Error inserting form data into database');
      }
      console.log('Form data inserted into database');
      res.redirect('/admin/lesson/table');
    });

};
