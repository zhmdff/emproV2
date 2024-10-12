const db = require('../config/db');

exports.getGroupTable = (req, res) => {
    const sql = 'SELECT * FROM groups';
    db.query(sql, (err, rows) => {
      if (err) {
        return res.status(500).send('Error fetching data');
      }
      res.render('student_form', { info: rows, username: req.session.username });
    });
};