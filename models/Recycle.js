const mongoose = require("mongoose");

const recycleSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking"
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

const Recycle = mongoose.model('Recycle', recycleSchema);
module.exports = Recycle;
