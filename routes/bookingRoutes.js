const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const {
	verifyToken,
	isAdmin,
	isEmployee,
} = require("../middleware/authMiddleware");

// Tạo đơn đặt xe mới
router.post(
	"/create",
	verifyToken,
	isEmployee,
	bookingController.createBooking
);

router.get("/", bookingController.getAllBookings);

router.get("/get-order-byuser/:userId", bookingController.getBookingsByUserId);

router.post("/getbyuserId/:month/:year", bookingController.getBookingsByUserId);

router.patch("/:bookingId", bookingController.updateBookingById);

router.get("/:bookingId", bookingController.getBookingById);

router.patch("/refund/:bookingId", bookingController.refundBooking);

router.delete("/delete/:bookingId", bookingController.deleteBookingById);

router.get("/getZeroTotal", bookingController.getAllBookingsWithTotalZero);

router.get("/revenue/:date", bookingController.getTotalRevenueByUserAndDate);

module.exports = router;
