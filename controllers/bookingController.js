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
const chatIdBooking = "-4196368779";
const chatIdRefund = "-4166682869"
const botTokenBooking = "7042630214:AAH8W9G_a9a00szypErr1YiKPUYghgY42UQ";
let accessToken =
	"kWm824uTP1Qm3WCDI1re6hK81WHNS3uI_oDPVbTzTYJTFrjoTqTZAEWrLrznMc01tWbeToPBK0sB6azn3LzTQBaQDXGONm89ba5bKn4p0mwwR3SO3oae3wjN7tjA07Ccr7z0KKesNJ73L6HEFpzg4AjvS74LAbbcj5fI3YyDMtcsGM4EB1PNROi6Mp0zT4CpkZjCNaH3LZpP2dvnU4KI2Om7BMvjUXWVx6iIQ6ruEn_kCHDrRd4F3_0-3X84SsHrXIO88oHfRroW61mW9myxGh9CDZXCFL5modL64505Qb-kGG0I9LTdL954RXu-6c48k54AImKY8I-RHafU8oDZIDjXHo9a2Y5z-q9FOMuMIGliRdfW4WP3EhfdKKK72re6ctjX73uCI7QTNbyN5ZH3I-ntTrP8JLVC9rukGWLb5W"
let refreshToken = "E1dIOMb9D3Wo6zbaRqauD3STt6rmGdr88NlUHtfKH1vUMA10Tb0kSNn-bouiMGOO46gZFHD30Y4NK_i-DG9RDH01uYXA55G54pF99XXiUoCVMvfw1tyUN1T0ycqyTN5F8aIJOo5wS3ibAFC7UmX06IDTzn43TKP0F7ZdSI9DP74XJkegVryBBbzuhYHCMn8K7N3rBI0dRdn-6TmaGJn3TMKZt6mr85yrA0xJ6W8gGYO43k8-FJfc8Jq3YZ8V8cm89oUED2mxR6Hm2OjOTIiPKYe2b7CD8IPPLMgANNTARGD8IuyjKMul2mjkaGqRO7mENqd34b82OI5I7Ey7VW9YEt87pXHjLIq9HNAz4szoFnTK8OmNUIWEJ7aiab1yEJHzHMQ7V6jP9pXXR80xP6bcr6bbKJKu"
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
		let message = escapeMarkdownV2(`*Thông tin đặt vé:*
		- ${booking.isPayment ? "ĐÃ THANH TOÁN " : "CHƯA THANH TOÁN"}
		- Tên khách: ${booking.customerName}
		- Số điện thoại: ${booking.phoneNumber}
		- Chuyến: ${booking.trip}
		- Thời gian đi : ${formatDate(booking.dateGo)} - ${booking.timeStart}
		${booking.quantity ? `${booking.quantity} Phòng đơn / ${(booking.ticketPrice).toLocaleString()}` : ""}
		${booking.quantityDouble ? `${booking.quantityDouble} Phòng đôi / ${(booking.ticketPriceDouble).toLocaleString()}` : ""}
		- Số ghế đi : ${booking.seats ? booking.seats : ""}
		- Đón vé đi : ${booking.pickuplocation}
		- Trả vé đi : ${booking.paylocation}\n\n\n	
		
		${booking.quantityBack > 0 || booking.quantityDoubleBack > 0 ? `- Thời gian về : ${formatDate(booking.dateBack)} - ${booking.timeBack}` : "" }
		${booking.quantityBack ? `${booking.quantityBack} Phòng đơn vé về / ${(booking.ticketPriceBack).toLocaleString()}` : ""}
		${booking.quantityDoubleBack ? `${booking.quantityDoubleBack} Phòng đôi vé về / ${(booking.ticketPriceDoubleBack).toLocaleString()}` : ""}
		${booking.seatsBack ? `- Số ghế về :  ${booking.seatsBack}`  : ""}\n\n\n
		${booking.quantityBack || booking.quantityDoubleBack ? `- Đón vé về : ${booking.pickuplocationBack}` : ""}
		${booking.quantityBack || booking.quantityDoubleBack ? `- Trả vé về : ${booking.paylocationBack}` : ""}
		
		
		- CK : ${booking.deposit ? booking.deposit : ""  }
		- Nhân viên :${user.name} 
		- Tổng tiền : ${(booking.total).toLocaleString()}`);
		message = message.replace(/^\s*/gm, '');
	await botBooking.sendMessage(chatIdBooking, message, { parse_mode: "MarkdownV2" });
	
		
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
			
			.sort({ date: -1 });
		// Chuyển đổi ngày thành định dạng 'dd/mm/yyyy' và username lên cấp độ cao hơn trong đôi tượng
		bookings = bookings.map((booking) => {
			const bookingObject = booking.toObject();
			// Format date
			// bookingObject.date = booking.date
			// 	.toISOString()
			// 	.substring(0, 10)
			// 	.split("-")
			// 	.reverse()
			// 	.join("/");

			// bookingObject.dateGo = booking.date
			// 	.toISOString()
			// 	.substring(0, 10)
			// 	.split("-")
			// 	.reverse()
			// 	.join("/");

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
	  const { date, startDate, endDate } = req.body; // Lấy date hoặc startDate và endDate từ body
  
	  if (!userId) {
		return res.status(400).json({ message: "userId is required" });
	  }
  
	  let query = { userId: userId }; // Tạo query mặc định
  
	  if (date) {
	    // Nếu có date, lọc bookings cho ngày đó
	    const specificDate = moment.utc(date, "YYYY-MM-DD");
	    query.date = { $eq: specificDate.toDate() };
	  } else if (startDate && endDate) {
	    // Nếu có startDate và endDate, lọc bookings trong khoảng thời gian đó
	    const start = moment.utc(startDate, "YYYY-MM-DD");
	    const end = moment.utc(endDate, "YYYY-MM-DD");
	    query.date = { $gte: start.toDate(), $lte: end.toDate() };
	  }
  
	  // Sử dụng query để tìm bookings và populate thông tin user
	  const bookings = await Booking.find(query)
		.sort({ createdAt: -1 })
		.populate('userId', 'name') // Lấy trường name từ User model
		.lean();
  
	  // Chuyển đổi kết quả để bao gồm trường name từ bảng User
	  const results = bookings.map(booking => ({
		...booking,
		name: booking.userId?.name, // Lấy trường name từ đôi tượng User
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
		
		if (!booking.isSendZNS) {
			await sendZaloMessage(formattedPhone, templateData);
			booking.isSendZNS = true; // Sử dụng toán tử so sánh chính xác
			await booking.save(); // Cập nhật trường isSendZNS trong cơ sở dữ liệu
		}
		
		let message = escapeMarkdownV2(`*Thông tin đặt vé:*
		- ${booking.isPayment ? "ĐÃ THANH TOÁN " : "CHƯA THANH TOÁN"}
		- Tên khách: ${booking.customerName}
		- Số điện thoại: ${booking.phoneNumber}
		- Chuyến: ${booking.trip}
		- Thời gian đi : ${formatDate(booking.dateGo)} - ${booking.timeStart}
		${booking.quantity ? `${booking.quantity} Phòng đơn / ${(booking.ticketPrice).toLocaleString()}` : ""}
		${booking.quantityDouble ? `${booking.quantityDouble} Phòng đôi / ${(booking.ticketPriceDouble).toLocaleString()}` : ""}
		- Số ghế đi : ${booking.seats ? booking.seats : ""}
		- Đón vé đi : ${booking.pickuplocation}
		- Trả vé đi : ${booking.paylocation}\n\n\n	
		
		${booking.quantityBack > 0 || booking.quantityDoubleBack > 0 ? `- Thời gian về : ${formatDate(booking.dateBack)} - ${booking.timeBack}` : "" }
		${booking.quantityBack ? `${booking.quantityBack} Phòng đơn vé về / ${(booking.ticketPriceBack).toLocaleString()}` : ""}
		${booking.quantityDoubleBack ? `${booking.quantityDoubleBack} Phòng đôi vé về / ${(booking.ticketPriceDoubleBack).toLocaleString()}` : ""}
		${booking.seatsBack ? `- Số ghế về :  ${booking.seatsBack}`  : ""}\n\n\n
		${booking.quantityBack || booking.quantityDoubleBack ? `- Đón vé về : ${booking.pickuplocationBack}` : ""}
		${booking.quantityBack || booking.quantityDoubleBack ? `- Trả vé về : ${booking.paylocationBack}` : ""}
		
		
		- CK : ${booking.deposit ? booking.deposit : ""  }
		- Nhân viên :${booking.name} 
		- Tổng tiền : ${(booking.total).toLocaleString()}`);
		message = message.replace(/^\s*/gm, '');
	await botBooking.sendMessage(chatIdBooking, message, { parse_mode: "MarkdownV2" });
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
    const { refundAmount, bank , season} = req.body;

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        const oldTotal = booking.total;

        // Cập nhật tổng số tiền mới sau khi hoàn tiền
        booking.total -= refundAmount;

        await booking.save();

        // Chuẩn bị thông tin để gửi qua bot
        const message = escapeMarkdownV2(`*Thông tin hoàn vé:*
        - Mã vé: ${booking.ticketCode}
        - Tên khách: ${booking.customerName}
        - Số điện thoại: ${booking.phoneNumber}
        - Tổng tiền hoàn: ${refundAmount.toLocaleString('vi-VN')}
        - Số tài khoản: ${bank}
		- Lý do : ${season}`);
        
        await bot.sendMessage(chatIdRefund, message, { parse_mode: "MarkdownV2" });

        let report = await Report.findOne({ date: booking.date });
        if (!report) {
            return res.status(404).json({ message: "Không tìm thấy báo cáo cho ngày đặt vé" });
        }

        // Tính toán lợi nhuận tương đối trước và sau khi hoàn tiền
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
        // Cập nhật lợi nhuận tương đối và doanh thu trong báo cáo
        report.relativeProfit += newRelativeProfit - oldRelativeProfit; // Sửa lại từ trừ sang cộng vì newRelativeProfit thường nhỏ hơn oldRelativeProfit
        report.revenue -= refundAmount;

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
        // Tìm booking nhưng không xóa ngay lập tức
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Lưu lại thông số cũ của đơn đặt xe để so sánh
        const oldTotal = booking.total;
        const oldBookingSource = booking.bookingSource ? booking.bookingSource.toLowerCase() : '';
        const oldBusCompany = booking.busCompany ? booking.busCompany.toLowerCase() : '';

        // Tìm report tương ứng với ngày của đơn đặt xe đã bị xóa
        let report = await Report.findOne({ date: booking.date });
        if (!report) {
            return res.status(404).json({ message: "Report not found for the booking date" });
        }

        // Cập nhật báo cáo dựa trên dữ liệu booking cũ
        if (booking.busCompany && report[oldBusCompany] && report[oldBusCompany] > 0) {
            report[oldBusCompany] -= 1;
        }

        if (booking.bookingSource && report[oldBookingSource] && report[oldBookingSource] > 0) {
            report[oldBookingSource] -= 1;
        }

        report.revenue -= oldTotal;

        // Cập nhật relativeProfit nếu cần
        // Giả sử calculateRelativeProfit là hàm async và cần được cải thiện để phản ánh đúng logic
        const oldRelativeProfit = await calculateRelativeProfit(booking.date, oldTotal, report.avStaffCostDeducted);
        report.relativeProfit -= oldRelativeProfit;

        await report.save();

        // Xóa booking sau khi đã cập nhật báo cáo
        await Booking.findByIdAndDelete(bookingId);

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
				totalRevenue: { $sum: "$total" }, // Tính tổng doanh thu
				totalTransfer: { $sum: "$transfer" }, // Tính tổng qua chuyển khoản
				totalCash: { $sum: "$cash" }, // Tính tổng tiền mặt
				totalGarageCollection: { $sum: "$garageCollection" }, // Tính tổng thu nhập từ garage
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
				transfer: "$totalTransfer",
				cash: "$totalCash",
				garageCollection: "$totalGarageCollection",
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
