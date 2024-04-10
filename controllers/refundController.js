const Refund = require("../models/refund");
exports.getAll = async (req, res) => {
	try {
		const refunds = await Refund.find().sort({ createdAt: -1 });
		res.status(200).json(refunds);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getById = async (req, res) => {
	try {
		const refund = await Refund.findById(req.params.id);
		if (!refund) {
			return res.status(404).json({ message: "Không tìm thấy bản ghi." });
		}
		res.status(200).json(refund);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
exports.updateStatus = async (req, res) => {
	try {
		const refund = await Refund.findById(req.params.id);
		if (!refund) {
			return res.status(404).json({ message: "Không tìm thấy bản ghi." });
		}
		refund.status = req.body.status; // Cập nhật trạng thái dựa trên dữ liệu gửi lên từ client
		await refund.save();
		res.status(200).json({ message: "Cập nhật trạng thái thành công." });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
exports.deleteById = async (req, res) => {
	try {
		const refund = await Refund.findByIdAndDelete(req.params.id);
		if (!refund) {
			return res
				.status(404)
				.json({ message: "Không tìm thấy bản ghi để xoá." });
		}
		res.status(200).json({ message: "Xoá bản ghi thành công." });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
