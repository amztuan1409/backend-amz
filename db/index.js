const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Thay thế 'your_mongodb_connection_string' bằng connection string thực tế của bạn.
    // Đảm bảo rằng bạn đã thay thế <username>, <password>, và <your-database> với thông tin thực tế.
    const conn = await mongoose.connect('mongodb://localhost:27017/data-amazing');

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Thoát với mã lỗi nếu không kết nối được
  }
};

module.exports = connectDB;
