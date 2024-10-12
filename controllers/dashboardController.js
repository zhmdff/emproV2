exports.dashboard = (req, res) => {
  const username = req.session.username;
  const userType = req.session.userType;  // Get userType from session
  const path = req.path;
  console.log(path)

  console.log('Test');  // Log session data for debugging
  console.log('Session data:', req.session);  // Log session data for debugging

  res.render('dashboard', { req, username, userType, path });  // Pass userType and path
};
