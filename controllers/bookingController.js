const Booking = require("../models/Booking");
const User = require("../models/User");
const Expense = require("../models/Expense");
const Report = require("../models/Report");
const mongoose = require("mongoose");
const dayjs = require("dayjs");
const axios = require("axios");
const APP_ID = "308620249544591200";
const APP_SECRET = "Pu2QXN0EoHiC30NM27VR";
const REDIRECT_URI = "https://amazinglimousine.vn";
const botToken = "6994113641:AAFtxp5Q3hUVUAfWCi6VNHxCfPghmPoMzEI";
const chatId = "6422234224";
const botTokenBooking = "7042630214:AAH8W9G_a9a00szypErr1YiKPUYghgY42UQ";
let accessToken = "QRj_V7Isp5bZkNHvShR0LMQ_SN1joPSmEujdLIdgqXHaipzUTx3yE0ZOIa95aUOK5VKeLNN_pW8YgpjDT-3t53Mz7KzpqyeODQKcMrdqumOwjpOYRBxrSXRgHZrqlhP5Pkbo1XVgfb5ncbSLEisNELAJKqKLdBSxKyr4SJYCd3nhqKze8jAA96pTUa8QYByO1kfLU1lXWLfog34E1kE2ScMvEmW6nDDBJiuQ1p61xdTzqpu45ThzM0UAJ1iRqAvQL9581KEIY6WM-44pMO-gJmhTOJTih9bNACvs1sgzWo8ayqjnDfkc1a3Q55OfhA4cVBfuGJxejmHtl6T25TEg27wh7IeVwF5HT9y941NtuZ9J_Yz54gtVAdJE20faeVfPSiam5MUyqs4XrZC6JgB380Rn80KbEu4LUAxDMG"
let refreshToken = "nzcIJKoxV0NDsvb8Ihjm2SZTd45LxZG0gyolCLdr90YxvfOlJ-CCP9Rpdsu8uozQrjwALpFo8axh-RK42yzPCkZNwnmHrr40chBVBr_KLXElsAS2V-TFGe73_5LtvnL6ylJzJH2M6LtXYArzOUi7OvJ5erSMnXvtyygcU0RsJ7JTzgLd3-X1ATRts6WdvrHOvD_9P1pcPr-TnlP-RFTBQfIRq2LKX5bgbENkGNFbM7swmC5mHVPHRfNrnqzKqbD0li6u5Kd132JFr89eHDCxABtOYm0urWqmlTM8Bqtv3MQRdgb8Ng9OHjZ7iWOvyLWKkkkmALR96ZMkgf4QSBarJxAEZ5uuc35YxwMkB1YLDJd9WDaGDgPJNiwYnXOredC4ri_A9WciJWs2axz5JBDKt7X0etq5"
// Hàm để làm mới access_token sử dụng refresh_token
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(botToken, { polling: false });
const botBooking = new TelegramBot(botTokenBooking, { polling: false });
function formatDate(dateStr) {
	let date = new Date(dateStr);
	let formattedDate = date.getDate().toString().padStart(2, '0') + '/' + 
						(date.getMonth() + 1).toString().padStart(2, '0') + '/' + 
						date.getFullYear().toString().substr(-2);
	return formattedDate;
  }
const refreshAccessToken = async () => {
	try {
		const response = await axios({
			method: "post",
			url: "https://oauth.zaloapp.com/v4/access_token",
			data: {
				app_id: APP_ID,
				app_secret: APP_SECRET,
				refresh_token: refreshToken, // Sử dụng refresh_token hiện tại
				grant_type: "refresh_token",
			},
		});

		accessToken = response.data.access_token;
		refreshToken = response.data.refresh_token; // Cập nhật refresh_token mới (nếu có)
		console.log("Refreshed access token:", accessToken);
		// Tiếp tục lưu trữ các token này an toàn
	} catch (error) {
		console.error("Error refreshing access token:", error);
	}
};

const sendZaloMessage = async (phone, templateData) => {
	try {
		const response = await axios({
			method: "post",
			url: "https://business.openapi.zalo.me/message/template",
			headers: {
				"Content-Type": "application/json",
				access_token: accessToken, // Sử dụng access_token từ biến global
			},
			data: {
				phone,
				template_id: "296928",
				template_data: templateData,
				tracking_id: "22312",
			},
		});
		console.log("Zalo API response:", response.data);
		return response.data;
	} catch (error) {
		if (error.response && error.response.status === 401) {
			// Lỗi không được ủy quyền có thể do access_token hết hạn
			console.log("Access token expired, refreshing...");
			await refreshAccessToken(); // Làm mới access_token
			return sendZaloMessage(phone, templateData); // Thử gửi tin nhắn lại
		}
		console.error("Error sending Zalo message:", error);
		throw error;
	}
};


exports.createBooking = async (req, res) => {
	try {
		const booking = new Booking({
			...req.body,
			userId: req.user.userId, // Giả sử req.user được thiết lập bởi middleware xác thực
		});
		const user = await User.findById(req.user.userId);
		if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

		// Kiểm tra xem đã tồn tại báo cáo cho ngày tạo đơn đặt xe hay chưa
		let report = await Report.findOne({ date: booking.date });

		if (!report) {
			// Nếu chưa tồn tại, tạo báo cáo mới
			report = new Report({
				date: booking.date,
			});
		}

		// Cập nhật thông tin báo cáo với đơn đặt xea mới
		updateReportWithBookingData(report, booking);

		// Lưu đơn đặt xe và báo cáo
		await booking.save();

		// Cập nhật thông tin template data
		const formattedPhone = booking.phoneNumber.startsWith("0")
			? "84" + booking.phoneNumber.slice(1)
			: booking.phoneNumber;
		const templateData = {
			full_name: booking.customerName,
			phone: formattedPhone,
			seat_number: booking.seats,
			// giodi_ngaydi: `${booking.timeStart} + ${dayjs(booking.dateGo).format(
			// 	"D-M-YYYY"
			// )}`,
			giodi_ngaydi: booking.timeStart,
			chuyen_di: booking.trip,
			don: booking.pickuplocation,
			tra: booking.paylocation,
			tongtien: booking.total,
		};

		const phone = formattedPhone; // Số điện thoại muốn gửi tin nhắn
		const zaloMessageResponse = await sendZaloMessage(phone, templateData);
		const message = escapeMarkdownV2(`*Thông tin đặt vé:*
		- ${booking.isPayment ? "ĐÃ THANH TOÁN " : "CHƯA THANH TOÁN"}
		- Tên khách: ${booking.customerName}
		- Số điện thoại: ${booking.phoneNumber}
		- Ngày đi : ${formatDate(booking.dateGo)}
		- Giờ đi: ${booking.timeStart}
		- Phòng đôi: ${booking.quantityDouble} - ${(booking.ticketPriceDouble).toLocaleString()}
		- Phòng đơn: ${booking.quantity} - ${(booking.ticketPrice).toLocaleString()}
		- Số ghế : ${booking.seats ? booking.seats : "Chưa xác nhận"} 
		- Đón : ${booking.pickuplocation}
		- Trả : ${booking.paylocation}
		- CK : ${booking.deposit}
		- Nhân viên :${user.name} 
		- Tổng tiền : ${(booking.total).toLocaleString()}`);
		
				await botBooking.sendMessage(chatId, message, { parse_mode: "MarkdownV2" });
		// Kiểm tra xem tin nhắn Zalo có được gửi thành công không
		if (zaloMessageResponse && zaloMessageResponse.message == "Success") {
			booking.isSendZNS = true; // Cập nhật trạng thái gửi tin nhắn Zalo thành công
		} else {
			console.log(
				"Failed to send Zalo message. Response:",
				zaloMessageResponse
			);
		}

		await booking.save(); // Lưu booking với trạng thái gửi tin nhắn cập nhật

		res.status(201).json(booking);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
}; 
const updateReportWithBookingData = async (report, booking) => {
	try {
		// Cập nhật tổng doanh thu
		report.revenue += booking.total;

		// Cập nhật số lượng đặt xe cho từng loại bookingSource
		if (booking.bookingSource) {
			const bookingSource = booking.bookingSource.toLowerCase();
			if (report[bookingSource] === undefined) {
				report[bookingSource] = 1;
			} else {
				report[bookingSource]++;
			}
		}

		// Cập nhật số lượng đặt xe cho từng loại busCompany
		if (booking.busCompany) {
			const busCompany = booking.busCompany.toLowerCase();
			if (report[busCompany] === undefined) {
				report[busCompany] = 1;
			} else {
				report[busCompany]++;
			}
		}

		// Tính toán relativeProfit và chờ cho đến khi Promise hoàn thành
		console.log(report.avStaffCostDeducted);
		const relativeProfit = await calculateRelativeProfit(
			booking.date,
			booking.total,
			report.avStaffCostDeducted
		);

		// Gán kết quả của relativeProfit vào report.relativeProfit
		report.relativeProfit += relativeProfit;

		// Đánh dấu rằng avStaffCost đã được trừ
		report.avStaffCostDeducted = true;

		await report.save();
	} catch (error) {
		console.error("Error updating report with booking data:", error);
		throw error; // Ném lỗi nếu có lỗi xảy ra
	}
};

// Hàm tính toán relativeProfit từ Expense
const calculateRelativeProfit = async (date, total, avStaffCostDeducted) => {
	try {
		// Tìm bản ghi Expense cho ngày tương ứng với đơn đặt xe
		const expense = await Expense.findOne({ date });

		// Khởi tạo totalAds và avStaffCost với giá trị mặc định
		let totalAds = 0;
		let avStaffCost = 5000000;

		// Nếu tìm thấy bản ghi Expense, cập nhật totalAds và avStaffCost từ bản ghi Expense
		if (expense) {
			totalAds = expense.totalAds || 0;
			avStaffCost = expense.avStaffCost || 5000000;
		}

		// Tính toán relativeProfit dựa trên thông tin của booking và giá trị từ Expense
		const relativeProfit = avStaffCostDeducted
			? total * 0.2 - totalAds
			: total * 0.2 - totalAds - avStaffCost;

		return relativeProfit;
	} catch (error) {
		// Xử lý lỗi nếu có
		console.error("Error calculating relative profit:", error);
		return 0; // Trả về giá trị mặc định trong trường hợp có lỗi
	}
};

exports.getAllBookings = async (req, res) => {
	try {
		const { year, month, userId } = req.query;
		let query = {};
		// Nếu có userId, thêm vào điều kiện query
		if (userId) {
			query.userId = mongoose.Types.ObjectId(userId);
		}
		// Nếu có month và year, thêm điều kiện về ngày
		if (month && year) {
			const startDate = new Date(Date.UTC(year, month - 1, 1));
			const endDate = new Date(Date.UTC(year, month, 0));
			query.date = { $gte: startDate, $lte: endDate };
		}
		// Truy vấn cơ sở dữ liệu để lấy bookings
		let bookings = await Booking.find(query)
			.populate("userId", "name") // Populating username from User model
			.select("-_id") // Exclude _id field
			.sort({ date: -1 });
		// Chuyển đổi ngày thành định dạng 'dd/mm/yyyy' và username lên cấp độ cao hơn trong đối tượng
		bookings = bookings.map((booking) => {
			const bookingObject = booking.toObject();
			// Format date
			bookingObject.date = booking.date
				.toISOString()
				.substring(0, 10)
				.split("-")
				.reverse()
				.join("/");

			bookingObject.dateGo = booking.date
				.toISOString()
				.substring(0, 10)
				.split("-")
				.reverse()
				.join("/");

			// Set username at the top-level of the object
			bookingObject.name = bookingObject.userId.name;
			// Remove the userId field
			delete bookingObject.userId;
			return bookingObject;
		});

		res.status(200).json(bookings);
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.json({ message: "Internal server error", error: error.message });
	}
};

const moment = require("moment");

exports.getBookingsByUserId = async (req, res) => {
	try {
	  const { userId } = req.body; // Lấy userId từ body
	  const {day , month, year } = req.params; // Lấy month và year từ URL params
  
	  if (!userId) {
		return res.status(400).json({ message: "userId is required" });
	  }
  
	  let query = { userId: userId, total: { $ne: 0 } }; // Tạo query mặc định
  
	  if (month && year) {
		// Nếu có month và year, thêm điều kiện về ngày vào query
		const startDate = moment.utc(`${year}-${month}-01`, "YYYY-MM-DD");
		const endDate = moment.utc(startDate).endOf("month");
		query.date = { $gte: startDate.toDate(), $lte: endDate.toDate() };
	  } else {
		// Nếu không có month và year, lấy dữ liệu cho tháng và năm hiện tại
		const currentMonth = moment.utc().month() + 1; // Tháng hiện tại (dựa trên index)
		const currentYear = moment.utc().year(); // Năm hiện tại
		const startDate = moment.utc(`${currentYear}-${currentMonth}-01`, "YYYY-MM-DD");
		const endDate = moment.utc(startDate).endOf("month");
		query.date = { $gte: startDate.toDate(), $lte: endDate.toDate() };
	  }
  
	  // Sử dụng query để tìm bookings và populate thông tin user
	  const bookings = await Booking.find(query)
		.sort({ createdAt: -1 })
		.populate('userId', 'name') // Lấy trường name từ User model
		.lean();
  
	  // Chuyển đổi kết quả để bao gồm trường name từ bảng User
	  const results = bookings.map(booking => ({
		...booking,
		name: booking.userId?.name, // Lấy trường name từ đối tượng User
		userId: booking.userId?._id // Nếu bạn muốn giữ lại trường userId
	  }));
  
	  res.status(200).json(results);
	} catch (error) {
	  res.status(500).json({ error: error.message });
	}
  };

exports.getBookingById = async (req, res) => {
	try {
		const bookingId = req.params.bookingId; // Lấy bookingId từ request parameters

		// Tìm đơn đặt xe theo ID
		const booking = await Booking.findById(bookingId);

		if (!booking) {
			return res.status(404).json({ message: "Booking not found" });
		}

		res.status(200).json(booking);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
exports.updateBookingById = async (req, res) => {
    const { bookingId } = req.params;
    const updateData = req.body; // Dữ liệu cập nhật từ body của request

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const oldTotal = booking.total;
        const oldBookingSource = booking.bookingSource ? booking.bookingSource.toLowerCase() : '';
        const oldBusCompany = booking.busCompany ? booking.busCompany.toLowerCase() : '';

        Object.assign(booking, updateData);
        await booking.save();

        let report = await Report.findOne({ date: booking.date });
        if (!report) {
            report = new Report({ date: booking.date });
        }

		
        // Adjust revenue and relativeProfit in the report
        report.revenue += booking.total - oldTotal;
        
        const oldRelativeProfit = await calculateRelativeProfit(booking.date, oldTotal, report.avStaffCostDeducted);
        const newRelativeProfit = await calculateRelativeProfit(booking.date, booking.total, report.avStaffCostDeducted);
        report.relativeProfit += newRelativeProfit - oldRelativeProfit;

        // Update bookingSource and busCompany counters if they have changed
        if (updateData.bookingSource && oldBookingSource !== updateData.bookingSource.toLowerCase()) {
            if (oldBookingSource && report[oldBookingSource] > 0) {
                report[oldBookingSource]--;
            }
            const newSource = updateData.bookingSource.toLowerCase();
            report[newSource] = (report[newSource] || 0) + 1;
        }

        if (updateData.busCompany && oldBusCompany !== updateData.busCompany.toLowerCase()) {
            if (oldBusCompany && report[oldBusCompany] > 0) {
                report[oldBusCompany]--;
            }
            const newCompany = updateData.busCompany.toLowerCase();
            report[newCompany] = (report[newCompany] || 0) + 1;
        }

        await report.save();

        // Send ZNS with updated information
        const formattedPhone = booking.phoneNumber.startsWith("0") ? "84" + booking.phoneNumber.slice(1) : booking.phoneNumber;
        const templateData = {
            full_name: booking.customerName,
            phone: formattedPhone,
            seat_number: booking.seats,
            giodi_ngaydi: booking.timeStart,
            chuyen_di: booking.trip,
            don: booking.pickuplocation,
            tra: booking.paylocation,
            tongtien: booking.total.toString()
        };

        await sendZaloMessage(formattedPhone, templateData);
		const message = escapeMarkdownV2(`*Thông tin đặt vé:*
		- ${booking.isPayment ? "ĐÃ THANH TOÁN " : "CHƯA THANH TOÁN"}
		- Tên khách: ${booking.customerName}
		- Số điện thoại: ${booking.phoneNumber}
		- Ngày đi : ${formatDate(booking.dateGo)}
		- Giờ đi: ${booking.timeStart}
		- Phòng đôi: ${booking.quantityDouble} - ${(booking.ticketPriceDouble).toLocaleString()}
		- Phòng đơn: ${booking.quantity} - ${(booking.ticketPrice).toLocaleString()}
		- Số ghế : ${booking.seats ? booking.seats : "Chưa xác nhận"} 
		- Đón : ${booking.pickuplocation}
		- Trả : ${booking.paylocation}
		- CK : ${booking.deposit}
		- Nhân viên :${booking.name} 
		- Tổng tiền : ${(booking.total).toLocaleString()}`);
		
		await botBooking.sendMessage(chatId, message, { parse_mode: "MarkdownV2" });

        res.status(200).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

function escapeMarkdownV2(text) {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (x) => '\\' + x);
}
exports.refundBooking = async (req, res) => {
    const { bookingId } = req.params;
    const { refundPercentage, refundPercentageDouble } = req.body;

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const oldTotal = booking.total;

        // Tính toán số tiền hoàn trả cho mỗi loại vé
        const refundAmountPerTicket =
            booking.ticketPrice * (1 - refundPercentage / 100);
        const refundAmountPerTicketDouble =
            booking.ticketPriceDouble * (1 - refundPercentageDouble / 100);

        // Tính tổng số tiền hoàn trả dựa trên số lượng vé
        const totalRefundSingle = refundAmountPerTicket * booking.quantity;
        const totalRefundDouble = refundAmountPerTicketDouble * booking.quantityDouble;
		const totalRefund = totalRefundSingle + totalRefundDouble;

		const message = escapeMarkdownV2(`*Thông tin hoàn vé:*
		- Mã vé: ${booking.ticketCode}
		- Tên khách: ${booking.customerName}
		- Số điện thoại: ${booking.phoneNumber}
		- Tiền hoàn vé đơn: ${refundAmountPerTicket.toLocaleString()} (${refundPercentage}%)
		- Tiền hoàn vé đôi: ${refundAmountPerTicketDouble.toLocaleString()} (${refundPercentageDouble}%)
		- Tổng tiền hoàn: ${totalRefund.toLocaleString()}`);
		
				await bot.sendMessage(chatId, message, { parse_mode: "MarkdownV2" });
        // Cập nhật giá vé mới sau hoàn tiền và tổng giá tiền của booking
        booking.ticketPrice = refundAmountPerTicket;
        booking.ticketPriceDouble = refundAmountPerTicketDouble;
        booking.total -= totalRefund;

        await booking.save();

        let report = await Report.findOne({ date: booking.date });
        if (!report) {
            return res.status(404).json({ message: "Report not found for the booking date" });
        }

        // Cập nhật số lượng đặt xe và doanh thu trong report
        const busCompany = booking.busCompany.toLowerCase();
        report[busCompany] -= 1;
        report.revenue -= oldTotal - booking.total;

        // Tính toán và cập nhật lại relativeProfit
        const oldRelativeProfit = await calculateRelativeProfit(
            booking.date,
            oldTotal,
            report.avStaffCostDeducted
        );
        const newRelativeProfit = await calculateRelativeProfit(
            booking.date,
            booking.total,
            report.avStaffCostDeducted
        );
        report.relativeProfit -= oldRelativeProfit - newRelativeProfit;

        await report.save();

        res.status(200).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};



exports.deleteBookingById = async (req, res) => {
	const { bookingId } = req.params;

	try {
		// Tìm và xóa đơn đặt xe
		const booking = await Booking.findByIdAndDelete(bookingId);
		if (!booking) {
			return res.status(404).json({ message: "Booking not found" });
		}

		// Lưu lại thông số cũ của đơn đặt xe để so sánh
		const oldTotal = booking.total;
		const oldBookingSource = booking.bookingSource.toLowerCase();
		const oldBusCompany = booking.busCompany.toLowerCase();

		// Tìm report tương ứng với ngày của đơn đặt xe đã bị xóa
		let report = await Report.findOne({ date: booking.date });
		if (!report) {
			return res
				.status(404)
				.json({ message: "Report not found for the booking date" });
		}

		if (booking.busCompany) {
			const busCompany = booking.busCompany.toLowerCase();
			if (report[busCompany] && report[busCompany] > 0) {
				report[busCompany] -= 1;
			}
		}

		// Giảm số lượng nguồn đặt trong báo cáo (nếu có)
		if (booking.bookingSource) {
			const bookingSource = booking.bookingSource.toLowerCase();
			if (report[bookingSource] && report[bookingSource] > 0) {
				report[bookingSource] -= 1;
			}
		}

		// Giảm doanh thu trong report
		report.revenue -= oldTotal;

		// Tính toán và giảm relativeProfit
		const oldRelativeProfit = await calculateRelativeProfit(
			booking.date,
			oldTotal,
			report.avStaffCostDeducted
		);
		report.relativeProfit -= oldRelativeProfit;

		// Lưu lại báo cáo đã được cập nhật
		await report.save();

		res.status(200).json({ message: "Booking deleted successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
};
exports.getAllBookingsWithTotalZero = async (req, res) => {
	try {
		const bookings = await Booking.find({ total: 0 }); // Truy vấn tất cả các đơn với total = 0
		res.json(bookings); // Trả về danh sách các đơn đặt hàng
	} catch (error) {
		console.error("Error fetching bookings with total 0:", error);
		res.status(500).json({ message: "Error fetching bookings with total 0" });
	}
};

exports.getTotalRevenueByUserAndDate = async (req, res) => {
	const { date } = req.params; // Nhận ngày từ tham số đường dẫn

	try {
		const parsedDate = new Date(date);
		parsedDate.setHours(0, 0, 0, 0);
		const endDate = new Date(parsedDate);
		endDate.setHours(23, 59, 59, 999);

		const aggregationPipeline = [
			{
				$match: {
					date: {
						$gte: parsedDate,
						$lt: endDate,
					},
				},
			},
			{
				$group: {
					_id: "$userId",
					totalRevenue: { $sum: "$total" },
				},
			},
			{
				$lookup: {
					from: "users", // Tên bảng 'User' trong cơ sở dữ liệu MongoDB
					localField: "_id", // Trường từ bảng 'Booking' để join
					foreignField: "_id", // Trường từ bảng 'User' để join
					as: "userDetails", // Tên mảng chứa kết quả sau khi join
				},
			},
			{
				$unwind: "$userDetails", // Bỏ mảng để có thể truy cập dữ liệu người dùng
			},
			{
				$project: {
					_id: 0,
					userId: "$_id",
					name: "$userDetails.name", // Chọn trường name từ kết quả join
					total: "$totalRevenue",
				},
			},
		];

		const result = await Booking.aggregate(aggregationPipeline);

		res.status(200).json(result);
	} catch (error) {
		console.error("Error getting total revenue by user and date:", error);
		res.status(500).json({
			message: "Error getting total revenue by user and date",
			error: error,
		});
	}
};
