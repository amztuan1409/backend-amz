const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Đăng ký người dùng mới
router.post("/register", authController.register);

// Đăng nhập người dùng
router.post("/login", authController.login);

router.get("/:id", authController.getId);

router.get("/", authController.getAllUsers);

module.exports = router;
