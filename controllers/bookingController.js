const Booking = require("../models/Booking");
const User = require("../models/User");
const Expense = require("../models/Expense");
const Report = require("../models/Report");
const Refund = require("../models/Refund");
const Recycle = require("../models/Recycle");
const mongoose = require("mongoose");
const SalesRace = require("../models/SalesRace");
const Message = require("../models/Message");
const dayjs = require("dayjs");
const axios = require("axios");
const APP_ID = "308620249544591200";
const APP_SECRET = "Pu2QXN0EoHiC30NM27VR";
const REDIRECT_URI = "https://amazinglimousine.vn";
const botToken = "6994113641:AAFtxp5Q3hUVUAfWCi6VNHxCfPghmPoMzEI";
const chatIdBooking = "-4196368779";
const chatIdRefund = "-4166682869";
const botTokenBooking = "7042630214:AAH8W9G_a9a00szypErr1YiKPUYghgY42UQ";
const ExcelJS = require("exceljs");
let accessToken =
  "g_YhKZojNNkX-g1NEgrHTwJyfLub-bWc_U_833I-FNBJkiujExKpT_2Kk3yJkYDhtQYACJYKTqRXW-OL6h9rNU-o-Ym3e7fGsO_N7oUyAaZXgO4PTgGYRkghgKGJZXaVXOkLLqQn17g6dOO4SBGKTQQoY0rwe2fwWxMe8MkINGw2cVXaHeWHATkjcduizZakyhZDU3MlI1YZfSr3EVvJ6Dt-sKCrnqbgs93UHHAtO328lUzSVgXSFu2i_a9YWri2ZvVnMckJP7ByfUO38x1jBE6_t6OQkLnD-wl8CpMNEXshguWsKEKJUPl1dHXTrI59lTUI7rlJ2NMYdQS7JwGgIAIic6OchYegvO-KHtoxEn-2kPWoUx0FOgsvhWzNW0HwgCweEdVZ3aAxi_yfHf5_GBopx2YlOyGPCBLSUm";
let refreshToken =
  "hap5E7ieTqMaJiuzVIXxIQ58opHYLdaFlbwI1cHTSG_hE9mRVZ1i9AOksr4IH0jhiK3eTd4cMd3g5hrfJm8BOy5YkszSKWuRwr7_RrmqC7VQ8T5sSZbW3wiCetC24MjkW7IdHpXS4p-nEgHAEbjtVhmwWmCP1sm_dIQr9WWbM3AGH9yv7bvj1R5DgIKLBNq9d3AqFYG11WAu9VOr03P2JjugfYvMIs5Js5xPMbOw5dxqAUKBLoGl3keNdGz02t8Xx1gGBZW6SpE40PK7B6D50OzWd1OxLrPliaVdKn1MNrRADhvB2WPAOwKDWHOTPbaff4su77fgNm7qQUu1J7472Sz5pIPzL60PztQZ7NLcLpNjR80KPaz3BEWfin9QBaiBvqMjToToPKwcT8HRSUrIW4rtC7P5";
// Hàm để làm mới access_token sử dụng refresh_token
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(botToken, { polling: false });
const botBooking = new TelegramBot(botTokenBooking, { polling: false });
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
function formatDate(dateStr) {
  let date = new Date(dateStr);
  let formattedDate =
    date.getDate().toString().padStart(2, "0") +
    "/" +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    "/" +
    date.getFullYear().toString().substr(-2);
  return formattedDate;
}
function generateRandomNumbers() {
  const randomNumbers = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 100)
  );
  // console.log(randomNumbers);
  return randomNumbers;
}

async function updateSalesTotalByMonthAndUser(
  userId,
  date,
  action,
  changeTransfer,
  changeCash,
  changeGarageCollection
) {
  try {
    // Tìm kiếm team chứa thành viên với userId
    const salesRace = await SalesRace.findOne({
      "teams.members.user": userId,
    });

    if (!salesRace) {
      console.log("Không tìm thấy team nào chứa thành viên với userId này.");
      return;
    }

    // Tìm team đầu tiên có chứa thành viên với userId
    const team = salesRace.teams.find((team) =>
      team.members.some((member) => member.user.equals(userId))
    );

    if (!team) {
      console.log(
        "Không tìm thấy thành viên với userId trong bất kỳ team nào."
      );
      return;
    }

    // Tìm thành viên trong team
    const member = team.members.find((member) => member.user.equals(userId));

    if (!member) {
      console.log("Không tìm thấy thành viên với userId này trong team.");
      return;
    }

    // Tìm sale tương ứng với tháng và năm
    const targetMonth = date.getMonth();
    const targetYear = date.getFullYear();
    const sales = member.sales.find((sale) => {
      const saleMonth = sale.month.getMonth();
      const saleYear = sale.month.getFullYear();
      return saleMonth === targetMonth && saleYear === targetYear;
    });

    if (!sales) {
      console.log("Không tìm thấy sale nào với tháng và năm trùng khớp.");
      return;
    }

    // Cập nhật dựa trên action
    if (action === "add") {
      sales.total += changeTransfer + changeCash + changeGarageCollection;
    } else if (action === "edit") {
      sales.total -= changeTransfer + changeCash + changeGarageCollection;
    } else {
      console.log("Action không hợp lệ. Vui lòng sử dụng 'add' hoặc 'edit'.");
      return;
    }

    // Lưu lại các thay đổi vào cơ sở dữ liệu
    await salesRace.save();
    // console.log(
    //   `Đã cập nhật: Transfer: ${sales.transfer}, Cash: ${sales.cash}, Garage Collection: ${sales.garageCollection}`
    // );
  } catch (error) {
    console.error("Lỗi khi tìm kiếm và cập nhật:", error);
  }
}
function convertToHTML(text) {
  const withBreaks = text.replace(/\n/g, "<br>"); // Chuyển \n thành <br>
  return withBreaks; // Không thêm khoảng trắng thay thế cho tab
}

const sendZaloMessage = async (phone, templateData, id) => {
  try {
    const auth = Buffer.from("amazingapi:JmG16BjN").toString("base64");
    const response = await axios({
      method: "post",
      url: "https://api-01.worldsms.vn/webapi/sendZNS",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      data: {
        client_req_id: generateRandomNumbers(),
        from: "1451842481579720828",
        to: phone,
        template_id: id,
        template_data: templateData,
        tracking_id: "22312",
      },
    });
    console.log("Zalo API response:", response.data);
    return response.data;
  } catch (error) {
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
    await updateSalesTotalByMonthAndUser(
      req.user.userId,
      booking.date,
      "add",
      booking.transfer,
      booking.cash,
      booking.garageCollection
    );

    // Cập nhật thông tin template data
    const formattedPhone = booking.phoneNumber.startsWith("0")
      ? "84" + booking.phoneNumber.slice(1)
      : booking.phoneNumber;

    const templateData = {
      name: booking.customerName,
      time: booking.timeStart + "-" + formatDate(booking.dateGo),
      route_name: booking.trip,
      sdt: formattedPhone,
      number_seat: booking.seats,
      surcharge: formatCurrency(booking.surcharge),
      amount: formatCurrency(booking.total),
      price: formatCurrency(booking.total),
      bank_info: "Ngân hàng MB",
      receiver_info: "Lê Chí Trung",
      account_number: "VQRQ0001ql2pu",
      amount: formatCurrency(booking.total),
      Note: booking.note || "Chưa có",
      hotline: "1900 588 810",
    };

    const phone = formattedPhone;
    const zaloMessageResponse = await sendZaloMessage(
      phone,
      templateData,
      333155
    );

    let message = `
		${
      booking.isPayment && booking.garageCollection > 0
        ? " " +
          `ĐÃ CỌC: ${(booking.transfer + booking.cash).toLocaleString()} ${
            booking.garageCollection > 0
              ? `- TÀI XẾ THU: ${booking.garageCollection.toLocaleString()}`
              : ""
          }`
        : booking.isPayment && booking.remaining == 0
        ? " " + "ĐÃ THANH TOÁN"
        : " " + "CHƯA THANH TOÁN"
    }
		Xe phòng nằm ${
      booking.busCompany == "AA"
        ? "An Anh Amazing"
        : booking.busCompany == "LV"
        ? "Long Vân Amazing"
        : booking.busCompany == "LH"
        ? "Lạc Hồng Amazing"
        : booking.busCompany == "TQĐ"
        ? "Tân Quang Dũng Amazing"
        : booking.busCompany == "PP"
        ? "Phong Phú Amazing"
        : "Tuấn Tú Amazing"
    } - ${booking.bookingSource}
		★ Ngày ${formatDate(booking.dateGo)} : ${booking.trip} : ${
      booking.timeStart
    } [PHÒNG số ${booking.seats} ]
		${
      booking.quantity && booking.quantityDouble
        ? `${booking.quantity} Phòng đơn = ${(
            booking.ticketPrice * booking.quantity
          ).toLocaleString()}\n \t\t ${booking.quantityDouble} Phòng đôi = ${(
            booking.ticketPriceDouble * booking.quantityDouble
          ).toLocaleString()}`
        : booking.quantity
        ? `${booking.quantity} Phòng đơn = ${(
            booking.ticketPrice * booking.quantity
          ).toLocaleString()}`
        : booking.quantityDouble
        ? `${booking.quantityDouble} Phòng đôi = ${(
            booking.ticketPriceDouble * booking.quantityDouble
          ).toLocaleString()}`
        : ""
    }
		✸ Đón: ${booking.pickuplocation}
		✸ Trả: ${booking.paylocation}
		★ Name: ${booking.customerName} - ${booking.phoneNumber}
    ${
      booking.surcharge > 0
        ? `- Phụ thu: ${booking.surcharge.toLocaleString()}`
        : ""
    }
		- Tổng tiền : ${booking.total.toLocaleString()}
		- Đã thanh toán: ${(booking.transfer + booking.cash).toLocaleString()}
		- Còn lại: ${booking.remaining.toLocaleString()}
		Nhân viên :${user.name}`;
    const messages = new Message({
      content: convertToHTML(message),
      userId: req.user.userId,
    });
    await messages.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createBookingFrist = async (req, res) => {
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
    await updateSalesTotalByMonthAndUser(
      req.user.userId,
      booking.date,
      "add",
      booking.transfer,
      booking.cash,
      booking.garageCollection
    );

    // Cập nhật thông tin template data
    const formattedPhone = booking.phoneNumber.startsWith("0")
      ? "84" + booking.phoneNumber.slice(1)
      : booking.phoneNumber;
    const templateData = {
      name: booking.customerName,
      time: booking.timeStart + "-" + formatDate(booking.dateGo),
      route_name: booking.trip,
      sdt: formattedPhone,
      number_seat: booking.seats,
      surcharge: formatCurrency(booking.surcharge),
      amount: formatCurrency(booking.total),
      price: formatCurrency(booking.total),
      bank_info: "Ngân hàng MB",
      receiver_info: "Lê Chí Trung",
      account_number: "VQRQ0001ql2pu",
      amount: formatCurrency(booking.total),
      Note: booking.note || "Chưa có",
      hotline: "1900 588 810",
    };

    const phone = formattedPhone;
    const zaloMessageResponse = await sendZaloMessage(
      phone,
      templateData,
      333155
    );
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createAndNotifyBooking = async (req, res) => {
  try {
    const booking = new Booking({
      ...req.body,
      userId: req.user.userId,
    });
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra xem đã tồn tại báo cáo cho ngày tạo đơn đặt xe hay chưa
    let report = await Report.findOne({ date: booking.date });

    if (!report) {
      report = new Report({
        date: booking.date,
      });
    }

    // Cập nhật thông tin báo cáo với đơn đặt xe mới
    updateReportWithBookingData(report, booking);

    // Lưu đơn đặt xe và báo cáo
    await booking.save();
    await updateSalesTotalByMonthAndUser(
      req.user.userId,
      booking.date,
      "add",
      booking.transfer,
      booking.cash,
      booking.garageCollection
    );

    const formattedPhone = booking.phoneNumber.startsWith("0")
      ? "84" + booking.phoneNumber.slice(1)
      : booking.phoneNumber;

    const templateData = {
      name: booking.customerName,
      time: booking.timeStart + "-" + formatDate(booking.dateGo),
      route_name: booking.trip,
      sdt: formattedPhone,
      number_seat: booking.seats,
      surcharge: formatCurrency(booking.surcharge),
      amount: formatCurrency(booking.total),
      price: formatCurrency(booking.total),
      bank_info: "Ngân hàng MB",
      receiver_info: "Lê Chí Trung",
      account_number: "VQRQ0001ql2pu",
      amount: formatCurrency(booking.total),
      Note: booking.note || "Chưa có",
      hotline: "1900 588 810",
    };

    const phone = formattedPhone;
    const zaloMessageResponse = await sendZaloMessage(
      phone,
      templateData,
      333155
    );

    // Tìm đặt vé khác có cùng ticketCode
    const linkedBooking = await Booking.findOne({
      roundTripId: booking.roundTripId,
    });

    let message = `
		${
      linkedBooking.isPayment && linkedBooking.garageCollection > 0
        ? `ĐÃ CỌC: ${(
            linkedBooking.transfer + linkedBooking.cash
          ).toLocaleString()} CHUYẾN ĐI - TÀI XÉ THU: ${linkedBooking.garageCollection.toLocaleString()}`
        : linkedBooking.isPayment && linkedBooking.remaining == 0
        ? "ĐÃ THANH TOÁN CHUYẾN ĐI"
        : "CHƯA THANH TOÁN CHUYẾN ĐI"
    }
		${
      booking.isPayment && booking.garageCollection > 0
        ? `ĐÃ CỌC: ${(
            booking.transfer + booking.cash
          ).toLocaleString()} CHUYẾN ĐI - TÀI XÉ THU: ${booking.garageCollection.toLocaleString()}`
        : booking.isPayment && booking.remaining == 0
        ? "ĐÃ THANH TOÁN CHUYẾN VỀ"
        : "CHƯA THANH TOÁN CHUYẾN VỀ"
    }
		Xe phòng nằm ${
      linkedBooking.busCompany == "AA"
        ? "An Anh Amazing"
        : linkedBooking.busCompany == "LV"
        ? "Long Vân Amazing"
        : linkedBooking.busCompany == "LH"
        ? "Lạc Hồng Amazing"
        : linkedBooking.busCompany == "TQĐ"
        ? "Tân Quang Dũng Amazing"
        : linkedBooking.busCompany == "PP"
        ? "Phong Phú Amazing"
        : "Tuấn Tú Amazing"
    } - ${linkedBooking.bookingSource}
		★ Ngày ${formatDate(linkedBooking.dateGo)} : ${linkedBooking.trip} : ${
      linkedBooking.timeStart
    } [PHÒNG số ${linkedBooking.seats} ]
		${
      linkedBooking.quantity && linkedBooking.quantityDouble
        ? `${linkedBooking.quantity} Phòng đơn = ${(
            linkedBooking.ticketPrice * linkedBooking.quantity
          ).toLocaleString()}\n  ${linkedBooking.quantityDouble} Phòng đôi = ${(
            linkedBooking.ticketPriceDouble * linkedBooking.quantityDouble
          ).toLocaleString()}`
        : linkedBooking.quantity
        ? `${linkedBooking.quantity} Phòng đơn = ${(
            linkedBooking.ticketPrice * linkedBooking.quantity
          ).toLocaleString()}`
        : linkedBooking.quantityDouble
        ? `${linkedBooking.quantityDouble} Phòng đôi = ${(
            linkedBooking.ticketPriceDouble * linkedBooking.quantityDouble
          ).toLocaleString()}`
        : ""
    }
		✸ Đón: ${linkedBooking.pickuplocation}
		✸ Trả: ${linkedBooking.paylocation}
    Xe phòng nằm ${
      booking.busCompany == "AA"
        ? "An Anh Amazing"
        : booking.busCompany == "LV"
        ? "Long Vân Amazing"
        : booking.busCompany == "LH"
        ? "Lạc Hồng Amazing"
        : booking.busCompany == "TQĐ"
        ? "Tân Quang Dũng Amazing"
        : booking.busCompany == "PP"
        ? "Phong Phú Amazing"
        : "Tuấn Tú Amazing"
    } - ${booking.bookingSource}
		★ Ngày ${formatDate(booking.dateGo)} : ${booking.trip} : ${
      booking.timeStart
    } [PHÒNG số ${booking.seats} ]
		${
      booking.quantity && booking.quantityDouble
        ? `${booking.quantity} Phòng đơn = ${(
            booking.ticketPrice * booking.quantity
          ).toLocaleString()}\n  ${booking.quantityDouble} Phòng đôi = ${(
            booking.ticketPriceDouble * booking.quantityDouble
          ).toLocaleString()}`
        : booking.quantity
        ? `${booking.quantity} Phòng đơn = ${(
            booking.ticketPrice * booking.quantity
          ).toLocaleString()}`
        : booking.quantityDouble
        ? `${booking.quantityDouble} Phòng đôi = ${(
            booking.ticketPriceDouble * booking.quantityDouble
          ).toLocaleString()}`
        : ""
    }
		✸ Đón: ${booking.pickuplocation}
		✸ Trả: ${booking.paylocation}
		★ Name: ${linkedBooking.customerName} - ${linkedBooking.phoneNumber}
    ${
      linkedBooking.surcharge > 0 || booking.surcharge > 0
        ? `- Phụ thu: ${(
            linkedBooking.surcharge + booking.surcharge
          ).toLocaleString()}`
        : ""
    }
		- Tổng tiền: ${(booking.total + linkedBooking.total).toLocaleString()}
		- Đã thanh toán: ${(
      booking.transfer +
      booking.cash +
      linkedBooking.transfer +
      linkedBooking.cash
    ).toLocaleString()}
		- Còn lại: ${(booking.remaining + linkedBooking.remaining).toLocaleString()}
		Nhân viên :${user.name}
		✸ Mã Khuyến Mãi: ${
      linkedBooking.ticketCode ? linkedBooking.ticketCode : "Chưa có khuyến mãi"
    }
        `;
    console.log(
      booking.transfer,
      booking.cash,
      linkedBooking.transfer,
      linkedBooking.cash
    );
    const messages = new Message({
      content: convertToHTML(message),
      userId: req.user.userId,
    });
    await messages.save();
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
        report[bookingSource] += booking.quantity + booking.quantityDouble;
      }
    }

    // Cập nhật số lượng đặt xe cho từng loại busCompany
    if (booking.busCompany) {
      const busCompany = booking.busCompany.toLowerCase();
      if (report[busCompany] === undefined) {
        report[busCompany] = 1;
      } else {
        report[busCompany] += booking.quantity + booking.quantityDouble;
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
    const {
      year,
      month,
      userId,
      page = 1,
      limit = 20,
      search,
      filters,
    } = req.query;
    let query = {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    };

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

    // Thêm điều kiện tìm kiếm
    if (search) {
      query.$or = [
        { phoneNumber: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        // Thêm các trường khác cần tìm kiếm
      ];
    }

    // Thêm điều kiện lọc
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (key === "dateGo") {
          if (Array.isArray(filters[key])) {
            query[key] = {
              $in: filters[key].map((dateStr) => new Date(dateStr)),
            };
          } else if (typeof filters[key] === "object") {
            query[key] = {
              $in: Object.values(filters[key]).map(
                (dateStr) => new Date(dateStr)
              ),
            };
          } else {
            query[key] = new Date(filters[key]);
          }
        } else {
          query[key] = filters[key];
        }
      });
    }

    // Tính tổng số bản ghi
    const total = await Booking.countDocuments(query);

    // Tính toán số lượng phần tử cần bỏ qua
    const skip = (page - 1) * limit;

    // Truy vấn cơ sở dữ liệu để lấy bookings
    let bookings = await Booking.find(query)
      .populate("userId", "name") // Populating username from User model
      .sort({ createdAt: -1 })
      .skip(skip) // Bỏ qua các phần tử trước trang hiện tại
      .limit(Number(limit)); // Giới hạn số phần tử lấy ra

    // Chuyển đổi ngày thành định dạng 'dd/mm/yyyy' và username lên cấp độ cao hơn trong đối tượng
    bookings = bookings.map((booking) => {
      const bookingObject = booking.toObject();
      // Check if userId exists and has a name property
      if (bookingObject.userId && bookingObject.userId.name) {
        // Set username at the top-level of the object
        bookingObject.name = bookingObject.userId.name;
      } else {
        bookingObject.name = "Tài khoản đã bị xóa";
      }
      // Remove the userId field
      delete bookingObject.userId;
      return bookingObject;
    });

    res.status(200).json({
      total,
      page,
      limit,
      bookings,
    });
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

    let query = {
      userId: userId,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }; // Tạo query mặc định

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
      .populate("userId", "name") // Lấy trường name từ User model
      .lean();

    // Chuyển đổi kết quả để bao gồm trường name từ bảng User
    const results = bookings.map((booking) => ({
      ...booking,
      name: booking.userId?.name, // Lấy trường name từ đôi tượng User
      userId: booking.userId?._id, // Nếu bạn muốn giữ lại trường userId
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
  const editorName = req.body.editorName;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    const excludeFields = ["_id", "date", "editBy", "name", "editorName"];

    // Đối tượng ánh xạ từ tiếng Anh sang tiếng Việt
    const fieldMappings = {
      customerName: "tên khách hàng",
      phoneNumber: "số điện thoại",
      trip: "chuyến đi",
      pickuplocation: "điểm đón",
      paylocation: "điểm trả",
      total: "tổng tiền",
      isPayment: "trạng thái thanh toán",
      isSendZNS: "gửi ZNS",
      surcharge: "phụ phí",
      transfer: "chuyển khoản",
      cash: "tiền mặt",
      garageCollection: "thu tại garage",
      remaining: "số tiền còn lại",
      ticketCode: "mã vé",
      quantity: "số lượng phòng đơn",
      quantityDouble: "số lượng phòng đôi",
      ticketPrice: "giá phòng đơn",
      ticketPriceDouble: "giá phòng đôi",
      busCompany: "hãng xe",
      bookingSource: "nguồn đặt",
      timeStart: "giờ đi",
      dateGo: "ngày đi",
      deposit: "chuyển khoản",
      seats: "phòng",
      note: "ghi chú",
    };

    // So sánh và ghi nhận sự thay đổi
    let changes = [];
    const fieldsToUpdate = Object.keys(updateData); // Lấy danh sách các trường sẽ cập nhật
    fieldsToUpdate.forEach((field) => {
      if (!excludeFields.includes(field)) {
        // Kiểm tra trường có trong danh sách loại trừ không
        const oldValue = booking[field];
        const newValue = updateData[field];
        if (
          newValue !== undefined &&
          newValue !== null &&
          oldValue !== null &&
          oldValue !== undefined &&
          oldValue.toString() !== newValue.toString()
        ) {
          // Sử dụng ánh xạ để thay thế tên trường
          const fieldNameInVietnamese = fieldMappings[field] || field; // Dùng tên tiếng Anh nếu không tìm thấy ánh xạ
          changes.push(
            `${fieldNameInVietnamese} đã được thay đổi từ ${
              oldValue ? oldValue : "trống"
            } sang ${newValue}`
          );
        }
      }
    });

    const oldTransfer = booking.transfer;
    const oldCash = booking.cash;
    const oldGarageCollection = booking.garageCollection;
    const oldTotal = booking.total;
    const totalQuantityOld = booking.quantity + booking.quantityDouble;
    const oldBookingSource = booking.bookingSource
      ? booking.bookingSource.toLowerCase()
      : "";
    const oldBusCompany = booking.busCompany
      ? booking.busCompany.toLowerCase()
      : "";
    Object.assign(booking, updateData);

    const editRecord = {
      time: new Date(), // Thời gian hiện tại
      name: editorName, // Tên người sửa đổi
      changes: changes, // Mảng các thay đổi
    };
    booking.editBy.push(editRecord);
    await booking.save();
    await updateSalesTotalByMonthAndUser(
      booking.userId,
      booking.date,
      "edit",
      oldTransfer,
      oldCash,
      oldGarageCollection
    );

    await updateSalesTotalByMonthAndUser(
      booking.userId,
      booking.date,
      "add",
      booking.transfer,
      booking.cash,
      booking.garageCollection
    );

    let report = await Report.findOne({ date: booking.date });
    if (!report) {
      report = new Report({ date: booking.date });
    }
    const totalQuantity = booking.quantity + booking.quantityDouble;

    const newBookingSource = updateData.bookingSource
      ? updateData.bookingSource.toLowerCase()
      : oldBookingSource;

    const newBusCompany = updateData.busCompany
      ? updateData.busCompany.toLowerCase()
      : oldBusCompany;

    report.revenue += booking.total - oldTotal;

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
    report.relativeProfit += newRelativeProfit - oldRelativeProfit;
    console.log(oldBookingSource, newBookingSource);
    if (oldBookingSource !== newBookingSource) {
      report[oldBookingSource] =
        (report[oldBookingSource] || 0) - totalQuantityOld;
      report[newBookingSource] =
        (report[newBookingSource] || 0) + totalQuantity;
    } else {
      report[oldBookingSource] =
        (report[oldBookingSource] || 0) + totalQuantity - totalQuantityOld;
    }

    if (oldBusCompany !== newBusCompany) {
      report[oldBusCompany] = (report[oldBusCompany] || 0) - totalQuantityOld;
      report[newBusCompany] = (report[newBusCompany] || 0) + totalQuantity;
    } else {
      report[oldBusCompany] =
        (report[oldBusCompany] || 0) + totalQuantity - totalQuantityOld;
    }
    await report.save();

    // Send ZNS with updated information
    // const formattedPhone = booking.phoneNumber.startsWith("0")
    //   ? "84" + booking.phoneNumber.slice(1)
    //   : booking.phoneNumber;
    // const templateData = {
    //   name: booking.customerName,
    //   time: booking.timeStart + "-" + formatDate(booking.dateGo),
    //   route_name: booking.trip,
    //   sdt: formattedPhone,
    //   number_seat: booking.seats,
    //   surcharge: formatCurrency(booking.surcharge),
    //   amount: formatCurrency(booking.total),
    //   price: formatCurrency(booking.total),
    //   bank_info: "Ngân hàng MB",
    //   receiver_info: "Lê Chí Trung",
    //   account_number: "VQRQ0001ql2pu",
    //   amount: formatCurrency(booking.total),
    //   Note: booking.note || "Chưa có",
    //   hotline: "1900 588 810",
    // };

    // const templateDataIsPayment = {
    //   customer_name: booking.customerName,
    //   time: booking.timeStart + "-" + formatDate(booking.dateGo),
    //   route_name: booking.trip,
    //   phone: formattedPhone,
    //   number_seat: booking.seats,
    //   surcharge: formatCurrency(booking.surcharge),
    //   pick_up: booking.pickuplocation || "Chưa có",
    //   drop_off: booking.paylocation || "Chưa có",
    //   price: formatCurrency(booking.total),
    //   amount: formatCurrency(booking.total),
    //   deposit: formatCurrency(
    //     booking.transfer + booking.garageCollection + booking.cash
    //   ),
    //   remaining: formatCurrency(booking.remaining),
    //   Note: booking.note || "Chưa có",
    //   hotline: "1900 588 810",
    // };

    // if (!booking.isPayment) {
    //   await sendZaloMessage(formattedPhone, templateData, 333155);
    //   booking.isSendZNS = true;
    //   await booking.save();
    // } else if (booking.isPayment) {
    //   await sendZaloMessage(formattedPhone, templateDataIsPayment, 333174);
    //   booking.isSendZNS = true;
    //   await booking.save();
    // }

    let message;
    if (!booking.roundTripId && !booking.ticketCode) {
      message = `
		${
      booking.isPayment && booking.garageCollection > 0
        ? " " +
          `ĐÃ CỌC: ${(booking.transfer + booking.cash).toLocaleString()} ${
            booking.garageCollection > 0
              ? `- TÀI XẾ THU: ${booking.garageCollection.toLocaleString()}`
              : ""
          }`
        : booking.isPayment && booking.remaining == 0
        ? " " + "ĐÃ THANH TOÁN"
        : " " + "CHƯA THANH TOÁN"
    }
		Xe phòng nằm ${
      booking.busCompany == "AA"
        ? "An Anh Amazing"
        : booking.busCompany == "LV"
        ? "Long Vân Amazing"
        : booking.busCompany == "LH"
        ? "Lạc Hồng Amazing"
        : booking.busCompany == "TQĐ"
        ? "Tân Quang Dũng Amazing"
        : booking.busCompany == "PP"
        ? "Phong Phú Amazing"
        : "Tuấn Tú Amazing"
    } - ${booking.bookingSource}
		★ Ngày ${formatDate(booking.dateGo)} : ${booking.trip} : ${
        booking.timeStart
      } [PHÒNG số ${booking.seats} ]
		${
      booking.quantity && booking.quantityDouble
        ? `${booking.quantity} Phòng đơn = ${(
            booking.ticketPrice * booking.quantity
          ).toLocaleString()}\n  ${booking.quantityDouble} Phòng đôi = ${(
            booking.ticketPriceDouble * booking.quantityDouble
          ).toLocaleString()}`
        : booking.quantity
        ? `${booking.quantity} Phòng đơn = ${(
            booking.ticketPrice * booking.quantity
          ).toLocaleString()}`
        : booking.quantityDouble
        ? `${booking.quantityDouble} Phòng đôi = ${(
            booking.ticketPriceDouble * booking.quantityDouble
          ).toLocaleString()}`
        : ""
    }
		✸ Đón: ${booking.pickuplocation}
		✸ Trả: ${booking.paylocation}
		★ Name: ${booking.customerName} - ${booking.phoneNumber}
		${
      booking.surcharge > 0
        ? `- Phụ thu: ${booking.surcharge.toLocaleString()}`
        : ""
    }
		- Tổng tiền : ${booking.total.toLocaleString()}
		- Đã thanh toán: ${(booking.transfer + booking.cash).toLocaleString()}
		- Còn lại: ${booking.remaining.toLocaleString()}
		Nhân viên :${booking.name}`;
    } else {
      let bookings = [];
      if (booking.roundTripId) {
        bookings = await Booking.find({
          roundTripId: booking.roundTripId,
        }).sort("createdAt");
      } else if (booking.ticketCode) {
        bookings = await Booking.find({ ticketCode: booking.ticketCode }).sort(
          "createdAt"
        );
      }

      if (bookings.length === 2) {
        const [outboundTicket, returnTicket] = bookings;
        message = `
			${
        outboundTicket.isPayment && outboundTicket.garageCollection > 0
          ? `ĐÃ CỌC: ${(
              outboundTicket.transfer + outboundTicket.cash
            ).toLocaleString()} CHUYẾN ĐI - TÀI XÉ THU: ${outboundTicket.garageCollection.toLocaleString()}`
          : outboundTicket.isPayment && outboundTicket.remaining == 0
          ? "ĐÃ THANH TOÁN CHUYẾN ĐI"
          : "CHƯA THANH TOÁN CHUYẾN ĐI"
      }
			${
        returnTicket.isPayment && returnTicket.garageCollection > 0
          ? `ĐÃ CỌC: ${(
              returnTicket.transfer + returnTicket.cash
            ).toLocaleString()} CHUYẾN ĐI - TÀI XÉ THU: ${returnTicket.garageCollection.toLocaleString()}`
          : returnTicket.isPayment && returnTicket.remaining == 0
          ? "ĐÃ THANH TOÁN CHUYẾN VỀ"
          : "CHƯA THANH TOÁN CHUYẾN VỀ"
      }
			Xe phòng nằm ${
        outboundTicket.busCompany == "AA"
          ? "An Anh Amazing"
          : outboundTicket.busCompany == "LV"
          ? "Long Vân Amazing"
          : outboundTicket.busCompany == "LH"
          ? "Lạc Hồng Amazing"
          : outboundTicket.busCompany == "TQĐ"
          ? "Tân Quang Dũng Amazing"
          : outboundTicket.busCompany == "PP"
          ? "Phong Phú Amazing"
          : "Tuấn Tú Amazing"
      } - ${outboundTicket.bookingSource}
			★ Ngày ${formatDate(outboundTicket.dateGo)} : ${outboundTicket.trip} : ${
          outboundTicket.timeStart
        } [PHÒNG số ${outboundTicket.seats} ]
			${
        outboundTicket.quantity && outboundTicket.quantityDouble
          ? `${outboundTicket.quantity} Phòng đơn = ${(
              outboundTicket.ticketPrice * outboundTicket.quantity
            ).toLocaleString()}\n  ${
              outboundTicket.quantityDouble
            } Phòng đôi = ${(
              outboundTicket.ticketPriceDouble * outboundTicket.quantityDouble
            ).toLocaleString()}`
          : outboundTicket.quantity
          ? `${outboundTicket.quantity} Phòng đơn = ${(
              outboundTicket.ticketPrice * outboundTicket.quantity
            ).toLocaleString()}`
          : outboundTicket.quantityDouble
          ? `${outboundTicket.quantityDouble} Phòng đôi = ${(
              outboundTicket.ticketPriceDouble * outboundTicket.quantityDouble
            ).toLocaleString()}`
          : ""
      }
			✸ Đón: ${outboundTicket.pickuplocation}
			✸ Trả: ${outboundTicket.paylocation}
			Xe phòng nằm ${
        returnTicket.busCompany == "AA"
          ? "An Anh Amazing"
          : returnTicket.busCompany == "LV"
          ? "Long Vân Amazing"
          : returnTicket.busCompany == "LH"
          ? "Lạc Hồng Amazing"
          : returnTicket.busCompany == "TQĐ"
          ? "Tân Quang Dũng Amazing"
          : returnTicket.busCompany == "PP"
          ? "Phong Phú Amazing"
          : "Tuấn Tú Amazing"
      } - ${returnTicket.bookingSource}
			★ Ngày ${formatDate(returnTicket.dateGo)} : ${returnTicket.trip} : ${
          returnTicket.timeStart
        } [PHÒNG số ${returnTicket.seats}]
			${
        returnTicket.quantity && returnTicket.quantityDouble
          ? `${returnTicket.quantity} Phòng đơn = ${(
              returnTicket.ticketPrice * returnTicket.quantity
            ).toLocaleString()}\n  ${
              returnTicket.quantityDouble
            } Phòng đôi = ${(
              returnTicket.ticketPriceDouble * returnTicket.quantityDouble
            ).toLocaleString()}`
          : returnTicket.quantity
          ? `${returnTicket.quantity} Phòng đơn = ${(
              returnTicket.ticketPrice * returnTicket.quantity
            ).toLocaleString()}`
          : returnTicket.quantityDouble
          ? `${returnTicket.quantityDouble} Phòng đôi = ${(
              returnTicket.ticketPriceDouble * returnTicket.quantityDouble
            ).toLocaleString()}`
          : ""
      }
			✸ Đón: ${returnTicket.pickuplocation}
			✸ Trả: ${returnTicket.paylocation}
	
			★ Name: ${outboundTicket.customerName} - ${outboundTicket.phoneNumber}
      ${
        outboundTicket.surcharge > 0 || returnTicket.surcharge > 0
          ? `- Phụ thu: ${(
              outboundTicket.surcharge + returnTicket.surcharge
            ).toLocaleString()}`
          : ""
      }
			- Tổng tiền: ${(returnTicket.total + outboundTicket.total).toLocaleString()}
			- Đã thanh toán: ${(
        returnTicket.transfer +
        returnTicket.cash +
        outboundTicket.transfer +
        outboundTicket.cash
      ).toLocaleString()}
			- Còn lại: ${(
        returnTicket.remaining + outboundTicket.remaining
      ).toLocaleString()}
			Nhân viên :${booking.name}
			✸ Mã Khuyến Mãi: ${
        outboundTicket.ticketCode
          ? outboundTicket.ticketCode
          : "Chưa có khuyến mãi"
      }
	
			`;
      } else {
        message = escapeMarkdownV2(`No voucher`);
      }
    }

    // await botBooking.sendMessage(chatIdBooking, message, {
    //   parse_mode: "MarkdownV2",
    // });
    const messages = new Message({
      content: convertToHTML(message),
      userId: booking.userId,
    });

    await messages.save();
    res.status(200).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.sendZNSPayment = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    const formattedPhone = booking.phoneNumber.startsWith("0")
      ? "84" + booking.phoneNumber.slice(1)
      : booking.phoneNumber;
    const templateData = {
      name: booking.customerName,
      time: booking.timeStart + "-" + formatDate(booking.dateGo),
      route_name: booking.trip,
      sdt: formattedPhone,
      number_seat: booking.seats,
      surcharge: formatCurrency(booking.surcharge),
      amount: formatCurrency(booking.total),
      price: formatCurrency(booking.total),
      bank_info: "Ngân hàng MB",
      receiver_info: "Lê Chí Trung",
      account_number: "VQRQ0001ql2pu",
      amount: formatCurrency(booking.total),
      Note: booking.note || "Chưa có",
      hotline: "1900 588 810",
    };

    const templateDataIsPayment = {
      customer_name: booking.customerName,
      time: booking.timeStart + "-" + formatDate(booking.dateGo),
      route_name: booking.trip,
      phone: formattedPhone,
      number_seat: booking.seats,
      surcharge: formatCurrency(booking.surcharge),
      pick_up: booking.pickuplocation || "Chưa có",
      drop_off: booking.paylocation || "Chưa có",
      price: formatCurrency(booking.total),
      amount: formatCurrency(booking.total),
      deposit: formatCurrency(
        booking.transfer + booking.garageCollection + booking.cash
      ),
      remaining: formatCurrency(booking.remaining),
      Note: booking.note || "Chưa có",
      hotline: "1900 588 810",
    };

    if (!booking.isPayment) {
      await sendZaloMessage(formattedPhone, templateData, 333155);
      booking.isSendZNS = true;
      await booking.save();
    } else if (booking.isPayment) {
      await sendZaloMessage(formattedPhone, templateDataIsPayment, 333174);
      booking.isSendZNS = true;
      await booking.save();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

function escapeMarkdownV2(text) {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

exports.refundBooking = async (req, res) => {
  const { bookingId } = req.params;
  const { refundAmount, bank, season, quantity, quantityDouble } = req.body;

  try {
    const booking = await Booking.findById(bookingId).populate("userId");
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    const user = booking.userId; // Đã được populate ở trên
    const nameEmployee = user ? user.name : "Không xác định"; // Thay 'Không xác định' theo nhu cầu

    const oldBookingSource = booking.bookingSource.toLowerCase();
    const oldBusCompany = booking.busCompany.toLowerCase();

    const refund = new Refund({
      nameEmployee: nameEmployee,
      dateGo: booking.dateGo,
      nameCustomer: booking.customerName,
      phoneCustomer: booking.phoneNumber,
      trip: booking.trip,
      amountRefund: refundAmount,
      seasonCancel: season,
      status: false,
    });
    await refund.save();

    const oldTotal = booking.total;
    const quantityToRefund = parseInt(quantity) + parseInt(quantityDouble);

    // Cập nhật tổng số tiền mới sau khi hoàn tiền
    booking.total -= refundAmount;

    booking.quantity -= quantity;
    booking.quantityDouble -= quantityDouble;
    await booking.save();
    await updateSalesTotalByMonthAndUser(
      booking.userId,
      booking.date,
      "edit",
      oldTotal // Trừ tổng số cũ ra
    );

    await updateSalesTotalByMonthAndUser(
      booking.userId,
      booking.date,
      "add",
      booking.total // Cộng tổng số mới vào
    );

    // Chuẩn bị thông tin để gửi qua bot
    const message = escapeMarkdownV2(`*Thông tin hoàn vé:*
        - Mã vé: ${booking.ticketCode}
        - Tên khách: ${booking.customerName}
        - Số điện thoại: ${booking.phoneNumber}
        - Tổng tiền hoàn: ${refundAmount.toLocaleString("vi-VN")}
        - Số tài khoản: ${bank}
        - Lý do : ${season}`);

    let report = await Report.findOne({ date: booking.date });
    if (!report) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy báo cáo cho ngày đặt vé" });
    }
    console.log(quantityToRefund);
    report[oldBookingSource] = report[oldBookingSource] - quantityToRefund;
    report[oldBusCompany] = report[oldBusCompany] - quantityToRefund;

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
    if (booking.total === 0) {
      await Booking.deleteOne({ _id: bookingId });
    } else {
      // Cập nhật trường remaining của booking
      booking.remaining =
        booking.total -
        (booking.transfer +
          booking.cash +
          booking.garageCollection +
          booking.refund);
      await booking.save();
    }

    // await bot.sendMessage(chatIdRefund, message, { parse_mode: "MarkdownV2" });

    res.status(200).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBookingById = async (req, res) => {
  const { bookingId } = req.params;
  const { userId } = req.body;
  try {
    // Tìm booking nhưng không xóa ngay lập tức
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    booking.isDeleted = true;
    booking.deletedBy = userId;
    console.log(userId);

    // Lưu lại thông số cũ của đơn đặt xe để so sánh
    const oldTotal = booking.total;
    const oldBookingSource = booking.bookingSource
      ? booking.bookingSource.toLowerCase()
      : "";
    const oldBusCompany = booking.busCompany
      ? booking.busCompany.toLowerCase()
      : "";

    // Tìm report tương ứng với ngày của đơn đặt xe đã bị xóa
    let report = await Report.findOne({ date: booking.date });
    if (!report) {
      return res
        .status(404)
        .json({ message: "Report not found for the booking date" });
    }

    // Cập nhật báo cáo dựa trên dữ liệu booking cũ
    if (
      booking.busCompany &&
      report[oldBusCompany] &&
      report[oldBusCompany] > 0
    ) {
      report[oldBusCompany] -= booking.quantity + booking.quantityDouble;
    }

    if (
      booking.bookingSource &&
      report[oldBookingSource] &&
      report[oldBookingSource] > 0
    ) {
      report[oldBookingSource] -= booking.quantity + booking.quantityDouble;
    }

    report.revenue -= oldTotal;

    // Cập nhật relativeProfit nếu cần
    // Giả sử calculateRelativeProfit là hàm async và cần được cải thiện để phản ánh đúng logic
    const oldRelativeProfit = await calculateRelativeProfit(
      booking.date,
      oldTotal,
      report.avStaffCostDeducted
    );
    report.relativeProfit -= oldRelativeProfit;

    await report.save();

    // Xóa booking sau khi đã cập nhật báo cáo
    // await Booking.findByIdAndDelete(bookingId);
    await updateSalesTotalByMonthAndUser(
      booking.userId,
      booking.date,
      "edit",
      booking.transfer,
      booking.cash,
      booking.garageCollection
    );
    await booking.save();
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
  const { startDate, endDate } = req.params; // Nhận ngày bắt đầu và ngày kết thúc từ tham số đường dẫn

  try {
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    parsedStartDate.setHours(0, 0, 0, 0);
    parsedEndDate.setHours(23, 59, 59, 999);

    const aggregationPipeline = [
      {
        $match: {
          date: {
            $gte: parsedStartDate,
            $lte: parsedEndDate,
          },
          $or: [{ isDeleted: false }, { isDeleted: { $eq: null } }],
        },
      },
      {
        $group: {
          _id: "$userId",
          totalRevenue: { $sum: "$total" }, // Tính tổng doanh thu
          totalTransfer: { $sum: "$transfer" }, // Tính tổng qua chuyển khoản
          totalCash: { $sum: "$cash" }, // Tính tổng tiền mặt
          totalGarageCollection: { $sum: "$garageCollection" }, // Tính tổng thu nhập từ garage
          totalRemaining: { $sum: "$remaining" }, // Tính tổng thu nhập từ garage
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
          remaining: "$totalRemaining",
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

exports.exportBookingsToExcel = async (req, res) => {
  try {
    const { search, filters } = req.query;

    // Xây dựng query từ các bộ lọc
    let query = { isDeleted: { $ne: true } };
    if (search) {
      query = {
        ...query,
        $or: [
          { phoneNumber: { $regex: search, $options: "i" } },
          { customerName: { $regex: search, $options: "i" } },
          // Thêm các trường cần tìm kiếm khác nếu có
        ],
      };
    }

    // Thêm các bộ lọc khác từ filters nếu có
    if (filters) {
      const parsedFilters = JSON.parse(filters);
      Object.keys(parsedFilters).forEach((key) => {
        if (parsedFilters[key] !== null) {
          if (Array.isArray(parsedFilters[key])) {
            query[key] = { $in: parsedFilters[key] };
          } else {
            query[key] = parsedFilters[key];
          }
        }
      });
    }

    console.log("Generated Query:", query); // Log query để kiểm tra

    // Truy vấn dữ liệu từ MongoDB
    const bookings = await Booking.find(query)
      .lean()
      .populate("userId", "name");
    console.log(bookings);

    if (bookings.length === 0) {
      return res.status(404).send("No bookings found matching the criteria.");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bookings");

    // Định nghĩa cột trong file Excel
    worksheet.columns = [
      { header: "Nguồn nhận", key: "bookingSource" },
      { header: "Nguồn chốt", key: "bookingSourceEnd" },
      { header: "Thời gian khởi hành", key: "timeStart" },
      { header: "Tên khách hàng", key: "customerName" },
      { header: "Số điện thoại", key: "phoneNumber" },
      { header: "Chuyến đi", key: "trip" },
      { header: "Điểm đón", key: "pickuplocation" },
      { header: "Điểm trả", key: "paylocation" },
      { header: "Số ghế", key: "seats" },
      { header: "Hãng xe", key: "busCompany" },
      { header: "Vé đơn", key: "quantity" },
      { header: "Giá vé đơn", key: "ticketPrice" },
      { header: "Giá vé đôi", key: "ticketPriceDouble" },
      { header: "Vé đôi", key: "quantityDouble" },
      { header: "Tổng tiền", key: "total" },
      { header: "Thanh toán", key: "isPayment" },
      { header: "Đã gửi ZNS", key: "isSendZNS" },
      { header: "Phụ thu", key: "surcharge" },
      { header: "Tiền chuyển khoản", key: "transfer" },
      { header: "Tiền mặt", key: "cash" },
      { header: "Nhà xe nhận", key: "garageCollection" },
      { header: "Còn lại", key: "remaining" },
      { header: "Mã khuyến mãi", key: "ticketCode" },
      { header: "Mã khứ hồi", key: "roundTripId" },
      { header: "editBy", key: "editBy" },
      { header: "Cọc", key: "deposit" },
      { header: "Tên nhân viên", key: "name" },
      { header: "Ngày", key: "date" },
      { header: "Ngày đi", key: "dateGo" },
      { header: "Ngày về", key: "dateBack" },
      { header: "Ghi chú", key: "note" },
      { header: "CV", key: "cv" },
    ];

    // Thêm dữ liệu vào worksheet
    bookings.forEach((booking) => {
      worksheet.addRow({
        bookingSource: booking.bookingSource,
        bookingSourceEnd: booking.bookingSourceEnd,
        timeStart: booking.timeStart,
        customerName: booking.customerName,
        phoneNumber: booking.phoneNumber,
        trip: booking.trip,
        pickuplocation: booking.pickuplocation,
        paylocation: booking.paylocation,
        seats: booking.seats,
        busCompany: booking.busCompany,
        quantity: booking.quantity,
        ticketPrice: booking.ticketPrice,
        ticketPriceDouble: booking.ticketPriceDouble,
        quantityDouble: booking.quantityDouble,
        total: booking.total,
        isPayment: booking.isPayment ? "Đã thanh toán" : "Chưa thanh toán",
        isSendZNS: booking.isSendZNS ? "Đã gửi ZNS" : "Chưa gửi ZNS",
        surcharge: booking.surcharge,
        transfer: booking.transfer,
        cash: booking.cash,
        garageCollection: booking.garageCollection,
        remaining: booking.remaining,
        ticketCode: booking.ticketCode,
        roundTripId: booking.roundTripId,
        editBy: booking.editBy,
        deposit: booking.deposit,
        name: booking.userId ? booking.userId.name : "Unknow",
        date: booking.date,
        dateGo: booking.dateGo,
        dateBack: booking.dateBack,
        note: booking.note,
        cv: booking.cv,
      });
    });

    // Thiết lập header để trả về file Excel
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=bookings.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).send("Error exporting data");
  }
};

exports.getUniqueDates = async (req, res) => {
  try {
    // Lấy các giá trị duy nhất của date và sắp xếp chúng giảm dần
    const dates = await Booking.distinct("date");
    const datesGo = await Booking.distinct("dateGo");

    // Sắp xếp các giá trị theo thứ tự giảm dần
    const sortedDates = dates.sort((a, b) => new Date(b) - new Date(a));
    const sortedDatesGo = datesGo.sort((a, b) => new Date(b) - new Date(a));

    // Trả về các giá trị này trong một đối tượng JSON
    res.status(200).json({
      dates: sortedDates,
      datesGo: sortedDatesGo,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dates", error });
  }
};

exports.restoreBookingById = async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Tìm booking đã bị đánh dấu là xóa
    const booking = await Booking.findOne({ _id: bookingId, isDeleted: true });
    if (!booking) {
      return res.status(404).json({ message: "Deleted booking not found" });
    }

    // Khôi phục booking
    booking.isDeleted = false;
    booking.deletedBy = null;

    // Cập nhật lại báo cáo
    const oldTotal = booking.total;
    const bookingSource = booking.bookingSource
      ? booking.bookingSource.toLowerCase()
      : "";
    const busCompany = booking.busCompany
      ? booking.busCompany.toLowerCase()
      : "";

    let report = await Report.findOne({ date: booking.date });
    if (!report) {
      // Tạo mới report nếu không tồn tại
      report = new Report({ date: booking.date });
    }

    report.revenue += oldTotal;
    report.relativeProfit += await calculateRelativeProfit(
      booking.date,
      oldTotal,
      report.avStaffCostDeducted
    );

    if (bookingSource) {
      if (!report[bookingSource]) {
        report[bookingSource] = 0;
      }
      report[bookingSource] += booking.quantity + booking.quantityDouble;
    }

    if (busCompany) {
      if (!report[busCompany]) {
        report[busCompany] = 0;
      }
      report[busCompany] += booking.quantity + booking.quantityDouble;
    }

    await report.save();

    // Cập nhật sales total
    await updateSalesTotalByMonthAndUser(
      booking.userId,
      new Date(booking.date),
      "add",
      booking.transfer,
      booking.cash,
      booking.garageCollection
    );

    await booking.save(); // Lưu thay đổi vào cơ sở dữ liệu

    res.status(200).json({ message: "Booking restored successfully", booking });
  } catch (error) {
    console.error("Error restoring booking:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllDeletedBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, filters } = req.query;
    let query = { isDeleted: true };

    // Thêm điều kiện tìm kiếm
    if (search) {
      query.$or = [
        { phoneNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        // Thêm các trường khác cần tìm kiếm nếu có
      ];
    }

    // Thêm điều kiện lọc
    if (filters) {
      Object.keys(filters).forEach((key) => {
        query[key] = filters[key];
      });
    }

    // Tính tổng số bản ghi
    const total = await Booking.countDocuments(query);

    // Tính toán số lượng phần tử cần bỏ qua
    const skip = (page - 1) * limit;

    // Truy vấn cơ sở dữ liệu để lấy bookings
    let bookings = await Booking.find(query)
      .populate("userId", "name") // Populating username from User model
      .populate("deletedBy", "name")
      .sort({ updatedAt: -1 })
      .skip(skip) // Bỏ qua các phần tử trước trang hiện tại
      .limit(Number(limit)); // Giới hạn số phần tử lấy ra

    // Chuyển đổi ngày thành định dạng 'dd/mm/yyyy' và username lên cấp độ cao hơn trong đối tượng
    bookings = bookings.map((booking) => {
      const bookingObject = booking.toObject();
      // Set username at the top-level of the object
      bookingObject.name = bookingObject.userId.name;
      // Remove the userId field
      delete bookingObject.userId;
      return bookingObject;
    });

    res.status(200).json({
      total,
      page,
      limit,
      bookings,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.permanentlyDeleteBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findOne({ _id: bookingId, isDeleted: true });
    if (!booking) {
      return res.status(404).json({ message: "Deleted booking not found" });
    }

    await Booking.deleteOne({ _id: bookingId });

    res
      .status(200)
      .json({ message: "Booking permanently deleted successfully" });
  } catch (error) {
    console.error("Error permanently deleting booking:", error);
    res.status(500).json({ error: error.message });
  }
};
