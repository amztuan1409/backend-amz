// Import the Report model
const Report = require("../models/Report"); // Update the path according to your project structure

function getStartAndEndDate(month, year) {
    // Kiểm tra năm nhuận
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

    // Số ngày trong mỗi tháng
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Lấy ngày bắt đầu và kết thúc của tháng
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, daysInMonth[month - 1], 23, 59, 59));

    return {
        startDate: startDate,
        endDate: endDate
    };
}

exports.getAllReports = async (req, res) => {
    try {
        // Lấy tham số tháng và năm từ URL
        const { month, year } = req.params;
		let result =  getStartAndEndDate(month , year)
		console.log("Ngày bắt đầu của tháng:", result.startDate.toISOString() );
		console.log("Ngày kết thúc của tháng:", result.endDate.toISOString() );
		let reports;
        // Nếu cả tháng và năm được cung cấp, thêm filter vào truy vấn
        if (month && year) {
	
			// Lấy dữ liệu báo cáo trong khoảng thời gian đã chỉ định
			reports = await Report.find({ date: { $gte:  result.startDate.toISOString(), $lte: result.endDate.toISOString() } });
        }
		
        res.status(200).json({
            status: "success",
            results: reports.length,
            data: {
                reports,
            },
        });
    } catch (err) {
        // Xử lý lỗi
        res.status(500).json({
            status: "error",
            message: "Server error: " + err.message,
        });
    }
};


