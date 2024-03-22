const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization') ? req.header('Authorization').split(' ')[1] : null;

  if (!token) {
    return res.status(403).json({ message: 'Token is required for authentication' });
  }

  try {
    const decoded = jwt.verify(token, 'amazing2024'); // Sử dụng SECRET_KEY mà bạn đã định nghĩa khi tạo token
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Sau khi xác thực token, lấy thông tin người dùng từ database
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    // Gán thêm thông tin role vào req.user để sử dụng ở các middleware sau hoặc controller
    req.user.role = user.role;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Failed to authenticate user' });
  }
};

// Middleware để kiểm tra xem người dùng có phải là admin hay không
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Require admin role' });
  }
};

// Middleware để kiểm tra xem người dùng có phải là employee hay không
const isEmployee = (req, res, next) => {
  if (req.user && req.user.role === 'employee') {
    next();
  } else {
    res.status(403).json({ message: 'Require employee role' });
  }
};

module.exports = { verifyToken, isAdmin, isEmployee };
