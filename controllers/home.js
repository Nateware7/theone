const FeedItem = require("../models/FeedItem"); // Ensure you import the model

module.exports = {
  getIndex: async (req, res) => {
    try {
      const feedItems = await FeedItem.find()
        .sort({ price: -1 }) // Sort by price descending
        .lean(); // Convert to plain JavaScript objects

      res.render("index", {
        feedItems: feedItems,
        user: req.isAuthenticated() ? req.user : null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
};
