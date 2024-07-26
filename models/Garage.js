const mongoose = require("mongoose");
const garageeSchema = new mongoose.Schema(
    {
    name: {
      type: String,
      required: true, unique: true
    },
    pickUp: {
      type: String,
    },
    dropOff: {
      type: String,
    }
    },
    { timestamps: true }
  );
  
  const Garage = mongoose.model('Garage', garageeSchema);
  module.exports = Garage;
  