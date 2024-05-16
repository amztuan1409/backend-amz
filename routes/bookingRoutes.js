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
router.post(
	"/create-first",
	verifyToken,
	isEmployee,
	bookingController.createBookingFrist
);
router.post(
	"/create-round-trip",
	verifyToken,
	isEmployee,
	bookingController.createAndNotifyBooking
);

router.get("/", bookingController.getAllBookings);

router.get("/get-order-byuser/:userId", bookingController.getBookingsByUserId);

router.post("/getbyuserId/", bookingController.getBookingsByUserId);

router.patch(
	"/:bookingId",
	verifyToken,
	bookingController.updateBookingById
);

router.get("/:bookingId", bookingController.getBookingById);

router.patch("/refund/:bookingId", bookingController.refundBooking);

router.delete("/delete/:bookingId", bookingController.deleteBookingById);

router.get("/getZeroTotal", bookingController.getAllBookingsWithTotalZero);

router.get(
	"/revenue/:startDate/:endDate",
	bookingController.getTotalRevenueByUserAndDate
);

module.exports = router;
