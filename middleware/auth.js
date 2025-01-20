module.exports = {
  ensureAuth: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.redirect("/login"); // Redirect to login if not authenticated
    }
  },
  ensureGuest: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    } else {
      res.redirect("/dashboard"); // Redirect to dashboard if already authenticated
    }
  },
  allowGuestAccess: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next(); // Allow authenticated users
    }
    // Guests also allowed, so proceed without redirecting
    next();
  },
};
