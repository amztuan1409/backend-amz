const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucherController");

router.get("/", voucherController.getAllVoucher);
router.patch("/update/:id", voucherController.updateVoucherStatus);

module.exports = router;
