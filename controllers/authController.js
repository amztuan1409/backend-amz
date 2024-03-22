const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
exports.login = async (req, res) => {
	const { username, password } = req.body;
	if (!username || !password) {
		return res
			.status(400)
			.json({ message: "Username and password are required" });
	}

	try {
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(401).json({ message: "Authentication failed" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Authentication failed" });
		}

		const payload = { userId: user._id, role: user.role };
		const token = jwt.sign(payload, "amazing2024", { expiresIn: "365d" });

		// Trả về thông tin tài khoản và token
		res.json({ message: "Authentication successful", user, token });
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
exports.register = async (req, res) => {
	const { username, password, name, role } = req.body;

	// Kiểm tra xem người dùng đã tồn tại chưa
	const userExists = await User.findOne({ username });
	if (userExists) {
		return res.status(400).send({ message: "Username already exists" });
	}

	// Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
	const hashedPassword = await bcrypt.hash(password, 10);

	// Tạo người dùng mới
	const user = new User({
		name,
		username,
		password: hashedPassword,
		role, // Thêm role nếu bạn cần phân biệt giữa các loại người dùng, ví dụ: 'employee', 'manager'
	});

	try {
		await user.save();
		res.status(201).send({ message: "User created successfully" });
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
};

exports.getId = async (req, res) => {
	const { id } = req.params; // Lấy ID từ params

	if (!id) {
		return res.status(400).json({ message: "User ID is required" });
	}

	try {
		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Trả về thông tin người dùng nhưng không bao gồm mật khẩu
		const { password, ...userData } = user.toObject();
		res.json(userData);
	} catch (error) {
		if (error.kind === "ObjectId") {
			return res.status(400).json({ message: "Invalid user ID" });
		}
		console.error("Get User ID error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

exports.getAllUsers = async (req, res) => {
	try {
		const users = await User.find().select("-password"); // Lấy tất cả người dùng nhưng loại bỏ trường mật khẩu
		res.json(users);
	} catch (error) {
		console.error("Error getting all users:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
