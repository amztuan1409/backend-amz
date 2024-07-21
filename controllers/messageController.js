const Message = require("../models/Message"); // Đường dẫn đến file model của bạn


exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("userId", "name") // Lấy thông tin name từ userId
      .sort({ _id: -1 }) // Sắp xếp theo ID giảm dần để lấy các tin nhắn mới nhất
      .limit(100) // Giới hạn kết quả lấy ra 100 tin nhắn mới nhất
      .exec();

    // Đảo ngược mảng tin nhắn để tin mới nhất nằm cuối
    messages.reverse();

    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi tải tin nhắn", error: err });
  }
};



// POST a new message
exports.createMessage = async (req, res) => {
  const { content, userId } = req.body;

  if (!content || !userId) {
    return res
      .status(400)
      .json({ message: "Content and userId are required." });
  }

  try {
    const newMessage = new Message({
      content,
      userId,
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating a new message", error: err });
  }
};

exports.searchMessages = async (req, res) => {
  const { keyword = "" } = req.body; // Lấy keyword từ body của request

  try {
    if (!keyword.trim()) {
      return res
        .status(400)
        .json({ message: "Keyword is required for searching." });
    }

    const query = {
      content: { $regex: keyword, $options: "i" }, // Tạo regex để tìm kiếm không phân biệt hoa thường
    };

    const messages = await Message.find(query)
      .populate("userId", "name email") // Lấy thêm thông tin của người gửi nếu cần
      .exec();

    if (messages.length === 0) {
      return res
        .status(404)
        .json({ message: "No messages found matching your query." });
    }

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Error searching messages", error: err });
  }
};
