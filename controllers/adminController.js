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
    
    const sql = 'SELECT * FROM group_list';
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

    const sql = 'SELECT * FROM group_list';

    db.query(sql, (err, rows) => {
    if (err) {
        console.log(err)
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
    const groupNumber2 = 'group_' + groupNumber;

    // Sanitize the table name to prevent SQL injection
    const tableName = groupNumber2.replace(/[^a-zA-Z0-9_]/g, '');

    // Define the SQL queries
    const sql = 'SELECT * FROM students WHERE group_name = ? LIMIT 1';
    const sql2 = `SELECT * FROM \`${tableName}\``;
    const sql3 = 'SELECT * FROM lessons';

    // Use Promise.all to run all three queries simultaneously
    Promise.all([
        new Promise((resolve, reject) => {
            db.query(sql, [groupNumber], (err, rows) => {
                if (err) return reject(err);
                resolve(rows.length > 0 ? rows[0] : null); // Resolve with the first row or null
            });
        }),
        new Promise((resolve, reject) => {
            db.query(sql2, (err, rows) => {
                if (err) return reject(err);
                resolve(rows); // Resolve with the result
            });
        }),
        new Promise((resolve, reject) => {
            db.query(sql3, (err, rows) => {
                if (err) return reject(err);
                resolve(rows); // Resolve with the lessons data
            });
        })
    ])
    .then(([studentData, tableData, lessonsData]) => {
        // Check if student data was found
        // if (!studentData) {
        //     return res.status(404).send('No students found for this group');
        // }

        // Render the view with all three datasets
        res.render('group_manage_form', {
            student: studentData,
            table: tableData,
            lessons: lessonsData,
            username: req.session.username,
            req,
            path: req.path,
            globalUserType: req.session.userType,
            tableName: tableName
        });
    })
    .catch(err => {
        console.error('Error fetching data:', err);
        return res.status(500).send('Error fetching data');
    });


};
    

exports.groupManageUpdate = (req, res) => {
    const groupNumber = req.params.group_number;
    const tableName = groupNumber.replace(/[^a-zA-Z0-9_]/g, '');

    // Prepare the SQL query to update lessons
    const updateQueries = []; // To hold SQL update queries
    const values = []; // To hold values for the prepared statement

    // Loop through the lessons in the request body
    for (let i = 1; i <= 10; i++) {
        const lesson = req.body[`lesson_${i}`]; // Get the lesson for each row
        if (lesson && lesson !== "none") { // Check if a lesson is selected
            // Prepare the update SQL query
            updateQueries.push(`lesson = ? WHERE id = ?`); // Update lesson where ID matches
            values.push(lesson, i); // Lesson value and the corresponding ID
        }
    }

    if (updateQueries.length > 0) {
        // Construct the SQL query
        const sql = `UPDATE \`${tableName}\` SET ${updateQueries.join(', ')}`;
        
        db.query(sql, values.flat(), (err, result) => { // Flatten values array for query
            if (err) {
                console.error(err);
                return res.status(500).send('Error updating lessons in database');
            }
            console.log('Lessons updated successfully');
            res.redirect('/admin/group/table'); // Redirect after successful update
        });
    } else {
        res.status(400).send('No lessons selected to update');
    }
};




exports.groupForm = (req, res) => {
    
    const sql = 'SELECT * FROM group_list';
    db.query(sql, (err, rows) => {
      if (err) {
        return res.status(500).send('Error fetching data from database');
      }

      res.render('group_form', { info: rows, username: req.session.username , req, path: req.path, globalUserType: req.session.userType  });
    });

};


exports.groupAdd = (req, res) => {
    const { name, number, start_year, specialty, type, graduation_year, is_active } = req.body;

    // Sanitize the table name to prevent SQL injection and ensure it starts with a letter
    const tableName = `group_${number.replace(/[^a-zA-Z0-9_]/g, '')}`;

    // Create the table using the sanitized table name
    const sqlCreateTable = `
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            id INT PRIMARY KEY AUTO_INCREMENT,
            lesson VARCHAR(255),
            teacher VARCHAR(100),
            course INT(5),
            semester INT(5)
        )
    `;

    // Check for required fields
    if (!name || !number || !start_year || !specialty || !type || !graduation_year) {
        return res.status(400).send('All fields are required');
    }

    // Create the table
    db.query(sqlCreateTable, (err) => {
        if (err) {
            console.error(err); // Log the error for debugging
            return res.status(500).send('Error creating table');
        }
        console.log(`Table '${tableName}' created or already exists.`);

        // Insert 10 empty rows into the newly created table
        const sqlInsertEmptyRows = `
            INSERT INTO ${tableName} (lesson, teacher, course, semester)
            VALUES ('', '', 1, 1), ('', '', 1, 1), ('', '', 1, 1), ('', '', 1, 1), 
                   ('', '', 1, 1), ('', '', 1, 1), ('', '', 1, 1), ('', '', 1, 1), 
                   ('', '', 1, 1), ('', '', 1, 1)
        `;
        
        db.query(sqlInsertEmptyRows, (err) => {
            if (err) {
                console.error(err); // Log the error for debugging
                return res.status(500).send('Error inserting empty rows');
            }
            console.log('10 empty rows inserted into the table');
            
            // Insert the group details into the group_list table
            const sqlInsert = `
                INSERT INTO group_list (group_name, group_number, start_year, specialty, type, graduation_year, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.query(sqlInsert, [name, number, start_year, specialty, type, graduation_year, is_active ? 1 : 0], (err, result) => {
                if (err) {
                    console.error(err); // Log the error for debugging
                    return res.status(500).send('Error inserting form data into database');
                }
                console.log('Form data inserted into database');
                res.redirect('/admin/group/table');
            });
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
    
    const { lesson_name, lesson_faculty, lesson_course, lesson_semester} = req.body;

    if (!lesson_name || !lesson_faculty || !lesson_course || !lesson_semester) {
      return res.status(400).send('All fields are required 3');
    }
  
    const sql = 'INSERT INTO lessons (lesson_name, lesson_faculty, lesson_course, lesson_semester) VALUES (?, ?, ?, ?)';
    db.query(sql, [lesson_name, lesson_faculty,lesson_course, lesson_semester], (err, result) => {
      if (err) {
        console.error(err); // Log the error for debugging
        return res.status(500).send('Error inserting form data into database');
      }
      console.log('Form data inserted into database');
      res.redirect('/admin/lesson/table');
    });

};
