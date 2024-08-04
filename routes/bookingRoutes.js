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
router.get("/filters", bookingController.getUniqueDates);
router.post(
  "/restore-booking/:bookingId",
  bookingController.restoreBookingById
);
router.patch("/send-zns-payment/:bookingId", bookingController.sendZNSPayment);
router.get("/get-order-byuser/:userId", bookingController.getBookingsByUserId);
router.get("/deleteds", bookingController.getAllDeletedBookings);
router.delete(
  "/delete-out-recycle/:bookingId",
  bookingController.permanentlyDeleteBooking
);
router.post("/getbyuserId", bookingController.getBookingsByUserId);
router.get("/export-excel", bookingController.exportBookingsToExcel);

router.patch("/:bookingId", verifyToken, bookingController.updateBookingById);

router.get("/:bookingId", bookingController.getBookingById);

router.patch("/refund/:bookingId", bookingController.refundBooking);

router.delete("/delete/:bookingId", bookingController.deleteBookingById);

router.get("/getZeroTotal", bookingController.getAllBookingsWithTotalZero);

router.get(
  "/revenue/:startDate/:endDate",
  bookingController.getTotalRevenueByUserAndDate
);

module.exports = router;
