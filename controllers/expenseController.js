const Expense = require("../models/Expense");
const Report = require("../models/Report");

exports.createExpense = async (req, res) => {
	try {
		const expenseData = {
			...req.body,
			// Thêm ngày để tìm reportId
			date: req.body.date,
			// Tính totalAds bằng tổng các trường
			totalAds: calculateTotalAds(req.body),
		};

		// Tìm reportId dựa trên ngày
		const reportId = await findReportIdByDate(req.body.date);
		console.log(reportId);
		if (!reportId) {
			throw new Error("Không tìm thấy báo cáo cho ngày này.");
		}

		// Thêm reportId vào dữ liệu chi phí
		expenseData.reportId = reportId;

		// Tạo mới Expense
		const expense = new Expense(expenseData);

		// Tính profitRateAvg
		const report = await Report.findById(reportId);
		if (!report) {
			throw new Error("Không tìm thấy báo cáo cho ngày này.");
		}
		const profitRateAvg = (report.relativeProfit / report.revenue) * 100;

		// Thêm profitRateAvg vào expense
		expense.profitRateAvg = profitRateAvg;

		// Lưu Expense
		await expense.save();

		// Cập nhật relativeProfit của Report
		await updateRelativeProfitInReport(expense);
		console.log(expense);
		res.status(201).json(expense);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

// Hàm tìm reportId dựa trên ngày
const findReportIdByDate = async (date) => {
	try {
		const report = await Report.findOne({ date: date });
		return report ? report._id : null;
	} catch (error) {
		console.error("Error finding reportId by date:", error);
		throw error;
	}
};
// Hàm tính tổng các trường liên quan đến quảng cáo
const calculateTotalAds = (data) => {
	const totalAdsFields = [
		"limousineAMZ",
		"roomSGDL",
		"roomBackup",
		"limousineBackup",
		"ggAds",
		"tiktokZaloAds",
	];
	const totalAds = totalAdsFields.reduce(
		(acc, field) => acc + (data[field] || 0),
		0
	);
	return totalAds + totalAds * 0.05; // Thêm 5% của tổng chi phí quảng cáo
};

const updateRelativeProfitInReport = async (expense) => {
	try {
		const populatedExpense = await Expense.findById(expense._id).populate(
			"reportId"
		);
		const report = populatedExpense.reportId;

		if (report) {
			// Tính relativeProfit từ thông tin Expense và Report đã được populate
			const relativeProfit =
				report.revenue * 0.2 - expense.totalAds - expense.avStaffCost;

			report.relativeProfit = relativeProfit;

			// Lưu Report
			await report.save();
		}
	} catch (error) {
		console.error("Error updating relativeProfit in Report:", error);
		throw error;
	}
};

exports.getAllExpenses = async (req, res) => {
	try {
		// Lấy tất cả các đối tượng Expense từ cơ sở dữ liệu
		const expenses = await Expense.find().lean();

		// Lặp qua từng đối tượng Expense để trộn dữ liệu từ reportId vào
		for (const expense of expenses) {
			// Kiểm tra xem đối tượng Expense có reportId không
			if (expense.reportId) {
				// Nếu có, lấy thông tin về revenue và relativeProfit từ Report
				const report = await Report.findById(
					expense.reportId,
					"revenue relativeProfit"
				).lean();

				// Trộn dữ liệu từ Report vào Expense
				if (report) {
					expense.revenue = report.revenue;
					expense.relativeProfit = report.relativeProfit;
				}
			}

			// Loại bỏ trường _id và reportId khỏi đối tượng Expense
			delete expense._id;
			delete expense.reportId;
		}

		// Trả về danh sách các đối tượng Expense đã được trộn dữ liệu
		res.status(200).json(expenses);
	} catch (error) {
		console.error("Error retrieving expenses:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
