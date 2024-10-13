exports.dashboard = (req, res) => {
  const username = req.session.username;
  const userType = req.session.userType;  // Get userType from session
  const path = req.path;

  res.render('dashboard', { req, username, userType, path });  // Pass userType and path
};
