const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const postsController = require("../controllers/posts");
const { ensureAuth, ensureGuest, allowGuestAccess } = require("../middleware/auth");

// Main Routes
router.get("/", homeController.getIndex);
router.get("/profile", ensureAuth, postsController.getProfile);
router.get("/feed", allowGuestAccess, postsController.getFeed); // Allow both guests and authenticated users
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signuping", authController.getSignuping);
router.post("/signuping", authController.postSignuping);

module.exports = router;
