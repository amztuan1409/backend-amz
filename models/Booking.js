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
    },
    bookingSourceEnd: {
      type: String,
    },
    timeStart: String,
    customerName: String,
    phoneNumber: String,
    trip: String,
    pickuplocation: String,
    paylocation: String,
    note: String,
    deposit: String,
    cv: String,
    seats: String,
    busCompany: {
      type: String,
    },
    quantity: Number,
    ticketPrice: Number,
    ticketPriceDouble: Number,
    quantityDouble: Number,
    total: Number,
    isPayment: { type: Boolean, default: false },
    isSendZNS: { type: Boolean, default: false },
    surcharge: {
      type: Number,
      default: 0,
    },
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
    refund : {
      type: Number,
      default: 0,
    },
    remaining: {
      type: Number,
      default: function () {
        return (
          this.total -
          (this.transfer + this.cash + this.garageCollection + this.surcharge )
        );
      },
    },

    ticketCode: {
      type: String,
    },
    roundTripId: {
      type: String,
    },
    editBy: [
      {
        time: {
          type: Date,
        },
        name: {
          type: String,
          required: true,
        },
        changes: [String],
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
