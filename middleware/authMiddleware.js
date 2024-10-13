module.exports = (req, res, next) => {

  // Allow access to admin_login without a session
  if (req.url === '/admin_login') {
    return next();
  }

  if (req.session.username) {
      next();
  } else {
      console.log("No session, redirecting to login");
      if (req.url !== '/login' && req.url !== '/register') {
          res.redirect('/login');
      } else {
          next();
      }
  }
};

  