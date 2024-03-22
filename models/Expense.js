const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
	{
		date: Date,
		reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report" }, // Thêm trường reportId để liên kết với Report
		limousineAMZ: { type: Number, default: 0 },
		roomSGDL: { type: Number, default: 0 },
		roomBackup: { type: Number, default: 0 },
		limousineBackup: { type: Number, default: 0 },
		ggAds: { type: Number, default: 0 },
		tiktokZaloAds: { type: Number, default: 0 },
		totalAds: { type: Number, default: 0 },
		avStaffCost: { type: Number, default: 5000000 },
		profitRateAvg: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);
module.exports = Expense;
