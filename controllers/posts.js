const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const FeedItem = require("../models/FeedItem");
const ProgramItem = require("../models/ProgramItem");

// Add this to the module.exports

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const feedItems = await FeedItem.find()
        .sort({ price: -1 })  // Sort by price descending
        .lean();  // Convert to plain JavaScript objects
      
      // Pass the items and user to the template
      res.render("feed", { 
        feedItems: feedItems, 
        user: req.isAuthenticated() ? req.user : null 
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Server Error");
    }
  },

  createFeedItem: async (req, res) => {
    try {
      await FeedItem.create({
        username: req.body.username,
        platform: req.body.platform,  // Add this line
        price: req.body.price,
        description: req.body.description,
        createdBy: req.user.id
      });
      console.log("Feed item has been added!");
      res.redirect("/feed");
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Error creating feed item" });
    }
  },
  
  
  deleteFeedItem: async (req, res) => {
    try {
      const feedItem = await FeedItem.findById(req.params.id);
      
      // Check if feedItem exists
      if (!feedItem) {
        return res.status(404).send("Item not found");
      }
      
      // Check if user owns the feedItem
      if (feedItem.createdBy.toString() !== req.user.id) {
        return res.status(401).send("Unauthorized");
      }
      
      await FeedItem.deleteOne({ _id: req.params.id });
      console.log("Deleted Feed Item");
      res.redirect("/feed");
    } catch (err) {
      console.log(err);
      res.status(500).send("Server Error");
    }
  },

  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      res.render("post.ejs", { post: post, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        user: req.user.id,
      });
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
  // posts.js - Update the createProgramItem function
  createProgramItem: async (req, res) => {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      // Validate required fields
      const { title, description, price, tags, features } = req.body;
      if (!title || !description || !price) {
        return res.status(400).json({ error: "Title, description, and price are required" });
      }

      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      // Create program item
      const programItem = await ProgramItem.create({
        title,
        description,
        price: parseFloat(price),
        tags: tags ? tags.split(",").map(tag => tag.trim()) : [],
        image: result.secure_url,
        cloudinaryId: result.public_id,
        features: features ? features.split(",").map(f => f.trim()) : [],
        createdBy: req.user.id
      });

      console.log("Program item created:", programItem._id);
      res.redirect("/program");
    } catch (err) {
      console.error("Create program error:", err);
      res.status(500).json({ error: err.message });
    }
  },  
  getProgram: async (req, res) => {
    try {
      if (req.params.id) {
        const program = await ProgramItem.findById(req.params.id);
        if (!program) {
          return res.status(404).send("Program not found");
        }
        // Render the new programDetail template for single item view
        res.render("programDetail.ejs", { program, user: req.isAuthenticated() ? req.user : null });
      } else {
        const programs = await ProgramItem.find().sort({ createdAt: -1 });
        res.render("program.ejs", { programs, user: req.isAuthenticated() ? req.user : null });
      }
    } catch (err) {
      console.log(err);
      res.status(500).send("Server Error");
    }
  },
  
};
