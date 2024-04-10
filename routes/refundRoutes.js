const express = require("express");
const router = express.Router();
const refundController = require("../controllers/refundController");

router.get("/", refundController.getAll);
router.get("/:id", refundController.getById);
router.patch("/update/:id", refundController.updateStatus);
router.delete("/delete/:id", refundController.deleteById);
module.exports = router;
