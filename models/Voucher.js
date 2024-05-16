const mongoose = require("mongoose");
const voucherSchema = new mongoose.Schema({
	codeVoucher: {
		type: String,
	},
	status: {
		type: Boolean,
	},
});
const Voucher = mongoose.model("Voucher", voucherSchema);
module.exports = Voucher;
