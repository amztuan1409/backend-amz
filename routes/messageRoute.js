const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
// Route to get messages
router.get("/", messageController.getMessages);

// Route to create a new message
router.post("/create", messageController.createMessage);

router.post("/search", messageController.searchMessages);

module.exports = router;
