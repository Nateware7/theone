const FeedItem = require("../models/FeedItem"); // Ensure you import the model

module.exports = {
  getIndex: async (req, res) => {
    try {
      const feedItems = await FeedItem.find({ isSold: false }) // Add filter
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
  
      res.render("index", {
        feedItems: feedItems,
        user: req.isAuthenticated() ? req.user : null
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
};
