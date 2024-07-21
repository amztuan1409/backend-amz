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
    amountRefund: {
      type: Number,
    },

    seasonCancel: {
      type: String,
    },
    detail: {
      amountRefund: {
        type: Number,
      },
      nameEmployee: {
        type: String,
      },
      note: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

const Refund = mongoose.models.Refund || mongoose.model("Refund", refundSchema);

module.exports = Refund;
