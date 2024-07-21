const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    date: Date,
    revenue: { type: Number, default: 0 },
    aa: { type: Number, default: 0 },
    lv: { type: Number, default: 0 },
    lh: { type: Number, default: 0 },
    tqđ: { type: Number, default: 0 },
    pp: { type: Number, default: 0 },
    tt: { type: Number, default: 0 },

    hl: { type: Number, default: 0 },
    lm: { type: Number, default: 0 },
    zl232: { type: Number, default: 0 },
    zl63292: { type: Number, default: 0 },
    zl978: { type: Number, default: 0 },
    zl200: { type: Number, default: 0 },
    zl428: { type: Number, default: 0 },
    zl83292: { type: Number, default: 0 },
    xepd: { type: Number, default: 0 },
    tiktok: { type: Number, default: 0 },
    pd: { type: Number, default: 0 },
    amz: { type: Number, default: 0 },
    zloa: { type: Number, default: 0 },
    sheet: { type: Number, default: 0 },
    khac: { type: Number, default: 0 },
    relativeProfit: { type: Number, default: 0 },
    avStaffCostDeducted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
