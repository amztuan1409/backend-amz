const express = require("express");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
const cron = require("node-cron");
const moment = require("moment-timezone");
const bookingRoutes = require("./routes/bookingRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const reportRoutes = require("./routes/reportRoutes");
const refundRoutes = require("./routes/refundRoutes");
const voucherRoutes = require("./routes/voucherRoutes");
const messageRoute = require("./routes/messageRoute");
const salesRaceRoutes = require("./routes/salesRaceRoutes");
const Report = require("./models/Report");
const connectDB = require("./db/index");
const app = express();
connectDB(); // Kết nối MongoDB

// Middleware setup
app.use(cors());
app.use(express.json()); // Để parse JSON payload từ request

cron.schedule(
  "* * * * *",
  async () => {
    try {
      // Lấy ngày hiện tại theo múi giờ "Asia/Ho_Chi_Minh" và chuyển đổi sang chuỗi định dạng YYYY-MM-DD
      const currentDateStr = moment()
        .tz("Asia/Ho_Chi_Minh")
        .format("YYYY-MM-DD");

      // Tìm kiếm báo cáo dựa trên chuỗi ngày tháng năm
      const existingReport = await Report.findOne({
        date: currentDateStr,
      }).exec();

      if (!existingReport) {
        // Tạo báo cáo mới với ngày dưới dạng chuỗi YYYY-MM-DD
        await Report.create({ date: currentDateStr });
        console.log(`Đã tạo báo cáo cho ngày ${currentDateStr}`);
      } else {
        console.log(`Báo cáo cho ngày ${currentDateStr} đã tồn tại.`);
      }
    } catch (error) {
      console.error("Lỗi khi tạo báo cáo:", error);
    }
  },
  {
    scheduled: true,
  }
);

// Sử dụng các router
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/refund", refundRoutes);
app.use("/api/voucher", voucherRoutes);
app.use("/api/salesrace", salesRaceRoutes);
app.use("/api/message", messageRoute);


app.listen(8800, () => console.log("Server running on port 8800"));
