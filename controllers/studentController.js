const db = require('../config/db');

// exports.getStudentForm = (req, res) => {
//   const sql = 'SELECT * FROM group_list';
//   db.query(sql, (err, rows) => {
//     if (err) {
//       return res.status(500).send('Error fetching data');
//     }
//     res.render('student_form', { info: rows, username: req.session.username });
//   });
// };

// exports.submitStudentForm = (req, res) => {
//   const { name, surname, username, password, email, group_name } = req.body;
//   if (!name || !surname || !username || !password || !email || !group_name) {
//     return res.status(400).send('All fields are required');
//   }

//   bcrypt.hash(password, 10, (err, hashedPassword) => {
//     if (err) {
//       return res.status(500).send('Error hashing password');
//     }

//     const sql = 'INSERT INTO students (name, surname, username, password, email, group_name) VALUES (?, ?, ?, ?, ?, ?)';
//     db.query(sql, [name, surname, username, hashedPassword, email, group_name], (err, result) => {
//       if (err) {
//         return res.status(500).send('Error inserting data');
//       }
//       res.redirect('/table');
//     });
//   });
// };

exports.getStudentTable = (req, res) => {
  if (['admin', 'moderator', 'student', 'teacher'].includes(req.session.userType)) {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const searchQuery = `%${search}%`;

    const countSql = 'SELECT COUNT(*) AS count FROM students WHERE name LIKE ? OR surname LIKE ?';
    const dataSql = 'SELECT * FROM students WHERE name LIKE ? OR surname LIKE ? ORDER BY surname ASC LIMIT ? OFFSET ?';

    db.query(countSql, [searchQuery, searchQuery], (err, countResult) => {
      if (err) {
        console.error('Database error:', err);  // Log error for debugging
        return res.status(500).send('Error fetching data from database');
      }

      const totalRecords = countResult[0].count;
      const totalPages = Math.ceil(totalRecords / limit);

      db.query(dataSql, [searchQuery, searchQuery, parseInt(limit), parseInt(offset)], (err, rows) => {
        if (err) {
          console.error('Database error:', err);  // Log error for debugging
          return res.status(500).send('Error fetching data from database');
        }

        const username = req.session.username;

        // Render the template with pagination, search results, and total pages
          res.render('student_table', { 
            info: rows, 
            username, 
            req, 
            path: req.path, 
            globalUserType: req.session.userType,  // Pass userType correctly as globalUserType
            search, 
            currentPage: parseInt(page), 
            totalPages 
        });
      
      });
    });
  } else {
    res.status(403).send('Access forbidden');
  }
};

exports.getLessonTable = (req, res) => {
  const username = req.session.username;  // Get the username from the session
  
  // Query to get the group name of the student based on their username
  const getGroupOfStudentSQL = 'SELECT group_name FROM students WHERE username = ?';

  // Query to get the group name first
  db.query(getGroupOfStudentSQL, [username], (err, result) => {
      if (err) {
          console.error('Database error:', err);  // Log error for debugging
          return res.status(500).send('Error fetching group from database');
      }

      const groupName = result[0].group_name;  // Assuming the group name is in the first result

      // Now concatenate the prefix 'group_' with the group name
      const tableName = `group_${groupName}`;

      // Use the dynamic table name and wrap it in backticks
      db.query(`SELECT lesson FROM \`${tableName}\``, (err, rows) => {
          if (err) {
              console.error('Database error:', err);  // Log error for debugging
              return res.status(500).send('Error fetching lessons from database');
          }

          // Render the template with data
          res.render('student_lesson_list', { 
              info: rows,  // Pass the fetched lesson data
              username,  // Pass the session username
              req,  // Pass the request object
              path: req.path,  // Pass the current path
              globalUserType: req.session.userType,  // Pass userType from session
          });
      });
  });
};




exports.getGroupTable = (req, res) => {
    const username = req.session.username;
    const globalUserType  = req.session.userType;
  
    if (globalUserType === 'student' || globalUserType === 'teacher') {
      // If the user is a student or teacher, fetch only their group
      const usersGroup = 'SELECT group_name FROM students WHERE username = ?';
  
      db.query(usersGroup, [username], (err, rows) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Error fetching data from database');
        }
  
        console.log(rows);
  
        // Check if rows contain data
        if (rows.length > 0) {
          const usGroup = rows[0].group_name; // Accessing the group_name from the first row
          console.log('User Group:', usGroup); // Log the value of usGroup for verification
  
          const sql = 'SELECT * FROM group_list WHERE group_name = ?';
  
          // Execute the query to get the specific group
          db.query(sql, [usGroup], (err, groupRows) => {
            if (err) {
              console.log(err);
              return res.status(500).send('Error fetching data from database');
            }
  
            // Render the view with the user-specific group data
            res.render('group_table', { info: groupRows, username, req, path: req.path, globalUserType });
          });
  
        } else {
          // Handle case where no group is found for the user
          res.render('group_table', { info: [], username, req, path: req.path, globalUserType });
        }
      });
    } else {
      res.status(403).send('Access forbidden');
    }
};


exports.getGroupInfo = (req, res) => {
  const groupNumber = req.params.group_number;
  const globalUserType = req.session.userType;

  if (globalUserType === 'admin') {
    // Admin can see all students in the specified group
    const sql = 'SELECT * FROM students WHERE group_name = ?';

    db.query(sql, [groupNumber], (err, rows) => {
      if (err) {
        console.error('Error fetching students:', err);
        return res.status(500).send('Error fetching students');
      }

      res.render('student_list', { info: rows, username: req.session.username, req, path: req.path, globalUserType });
    });
  
  } else if (globalUserType === 'student' || globalUserType === 'teacher') {
    // Students and teachers can only see their own group
    const usersGroupQuery = 'SELECT group_name FROM students WHERE username = ?'; // Assuming username is stored in the session

    db.query(usersGroupQuery, [req.session.username], (err, rows) => {
      if (err) {
        console.error('Error fetching user group:', err);
        return res.status(500).send('Error fetching user group');
      }

      // Check if rows contain data
      if (rows.length > 0) {
        const userGroup = rows[0].group_name;

        if (userGroup === groupNumber) {
          // If the user belongs to the requested group, fetch the students
          const sql = 'SELECT * FROM students WHERE group_name = ?';

          db.query(sql, [userGroup], (err, students) => {
            if (err) {
              console.error('Error fetching students:', err);
              return res.status(500).send('Error fetching students');
            }

            res.render('student_list', { info: students, username: req.session.username, req, path: req.path, globalUserType });
          });
        } else {
          // User does not belong to the requested group
          res.status(403).send('Access forbidden: You do not belong to this group.');
        }
      } else {
        // Handle case where no group is found for the user
        res.status(404).send('User group not found.');
      }
    });
  } else {
    res.status(403).send('Access forbidden');
  }
};

