const mongoose = require("mongoose");
const bookingSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		date: Date,
		dateGo: Date,
		bookingSource: {
			type: String,
			enum: [
				"ZL428",
				"ZL200",
				"ZL232",
				"ZL978",
				"PD",
				"LM",
				"ZLOA",
				"AMZ",
				"VN",
				"COM",
				"DT",
				"HL",
			],
		},
		timeStart: String,
		customerName: String,
		phoneNumber: String,
		trip: String,
		pickuplocation: String,
		paylocation: String,
		note: String,
		deposit: String,
		seats: String,
		busCompany: {
			type: String,
			enum: ["AA", "LV", "LH", "TQĐ", "PP", "KT"], // Các giá trị cho busCompany
		},
		quantity: Number,
		ticketPrice: Number,
		ticketPriceDouble: Number,
		quantityDouble: Number,
		total: Number,
		isPayment: { type: Boolean, default: false },
		isSendZNS: { type: Boolean, default: false },
		transfer: {
			type: Number,
			default: 0,
		},
		cash: {
			type: Number,
			default: 0,
		},
		garageCollection: {
			type: Number,
			default: 0,
		},
		remaining: {
			type: Number,
			default: function () {
				return this.total - (this.transfer + this.cash + this.garageCollection);
			},
		},

		ticketCode: {
			type: String,
			default: () => {
				const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
				let ticketCode = "AMZ";
				for (let i = 0; i < 5; i++) {
					ticketCode += characters.charAt(
						Math.floor(Math.random() * characters.length)
					);
				}
				return ticketCode;
			},
			unique: true,
		},
	},
	{ timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
