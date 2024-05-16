const Voucher = require("../models/Voucher");
exports.getAllVoucher = async (req, res) => {
	try {
		const vouchers = await Voucher.find();
		res.json(vouchers);
	} catch (error) {
		console.error("Error getting all users:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
// Cập nhật trạng thái của một voucher thành true
exports.updateVoucherStatus = async (req, res) => {
	const { id } = req.params; // Lấy ID của voucher từ URL

	try {
		// Tìm voucher bằng ID và cập nhật trạng thái của nó thành true
		const updatedVoucher = await Voucher.findByIdAndUpdate(
			id,
			{ status: true },
			{ new: true } // Tùy chọn này sẽ trả về đối tượng đã được cập nhật
		);

		if (!updatedVoucher) {
			return res.status(404).json({ message: "Voucher not found" });
		}

		// Trả về voucher đã cập nhật
		res.json(updatedVoucher);
	} catch (error) {
		console.error("Error updating voucher status:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
