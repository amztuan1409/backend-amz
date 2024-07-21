const mongoose = require("mongoose");

const salesRaceSchema = new mongoose.Schema({
  name: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  teams: [
    {
      name: { type: String },
      members: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          sales: [
            {
              month: { type: Date },
              total: { type: Number, default: 0 },
              KPI: { type: Number, default: 0 },
            },
          ],
        },
      ],
    },
  ],
});

const SalesRace = mongoose.model("SalesRace", salesRaceSchema);
module.exports = SalesRace;
