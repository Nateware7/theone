const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const postsController = require("../controllers/posts");
const { ensureAuth, ensureGuest, allowGuestAccess } = require("../middleware/auth");
const upload = require("../middleware/multer");
const cartRoutes = require("../routes/cart");
const checkoutRoutes = require('../routes/checkout');



// Main Routes
router.get("/", homeController.getIndex);
router.get("/profile", ensureAuth, postsController.getProfile);
router.get("/feed", allowGuestAccess, postsController.getFeed); // Allow both guests and authenticated users
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signuping", authController.getSignuping);
router.post("/signuping", authController.postSignuping);
// Add this route
router.post("/createFeedItem", ensureAuth, postsController.createFeedItem);
router.delete("/feedItem/:id", ensureAuth, postsController.deleteFeedItem);
// Program Routes
router.get("/program", allowGuestAccess, postsController.getProgram); // List all programs
router.get("/program/:id", allowGuestAccess, postsController.getProgram); // Single program
router.post(
    "/createProgramItem", 
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'programFile', maxCount: 1 }
    ]), 
    ensureAuth, 
    postsController.createProgramItem
  );

//cart routes
router.use("/", cartRoutes); // Add this line
// Add after other route declarations
router.use('/', checkoutRoutes);
module.exports = router;
