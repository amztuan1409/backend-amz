const mongoose = require("mongoose");
const refundSchema = new mongoose.Schema(
	{
		nameEmployee: {
			type: String,
		},
		dateGo: {
			type: Date,
		},
		nameCustomer: {
			type: String,
		},
		phoneCustomer: {
			type: String,
		},
		trip: {
			type: String,
		},
		totalBooking: {
			type: Number,
		},
		amountRefund: {
			type: Number,
		},
		difference: {
			type: Number,
		},
		seasonCancel: {
			type: String,
		},
		status: {
			type: Boolean,
			default: false,
		},
		detail: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Booking",
		}
	},
	{ timestamps: true }
);

const Refund = mongoose.models.Refund || mongoose.model("Refund", refundSchema);

module.exports = Refund;
