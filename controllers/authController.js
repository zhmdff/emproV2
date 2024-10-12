const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.login = (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM students WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      req.session.errorMessage = "No username found";
      return res.redirect('/login');
    }

    const hashedPassword = results[0].password;
    bcrypt.compare(password, hashedPassword, (err, result) => {
      if (err) {
        return res.status(500).send('Internal server error');
      }

      if (result) {
        req.session.username = results[0].username;
        req.session.userType = results[0].userType;
        res.redirect('/dashboard');
      } else {
        res.status(401).send('Incorrect password');
      }
    });
  });
};

exports.admin_login = (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      req.session.errorMessage = "No username found";
      return res.redirect('/admin_login');
    }

    const hashedPassword = results[0].password;
    bcrypt.compare(password, hashedPassword, (err, result) => {
      if (err) {
        return res.status(500).send('Internal server error');
      }

      if (result) {
        req.session.username = results[0].username;
        req.session.userType = results[0].userType;
        res.redirect('/dashboard');
      } else {
        res.status(401).send('Incorrect password');
      }
    });
  });
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/login');
    }
  });
};

exports.dashboard = (req, res) => {
  res.render('dashboard');
};
