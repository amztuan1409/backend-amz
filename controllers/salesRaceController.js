const SalesRace = require("../models/SalesRace");
const Booking = require("../models/Booking"); // Giả sử bạn đã có model Booking
const moment = require("moment");
function getMonthsInRange(startDate, endDate) {
  let start = moment(startDate);
  let end = moment(endDate);
  let months = [];

  while (start.isBefore(end)) {
    months.push(moment(start).toDate());
    start.add(1, "month");
  }
  return months;
}
exports.createRace = async (req, res) => {
  const { startDate, endDate, name } = req.body;
  try {
    const newRace = new SalesRace({
      startDate,
      endDate,
      name,
      teams: [],
    });
    await newRace.save();
    res
      .status(201)
      .send({ message: "Sales Race created successfully", newRace });
  } catch (error) {
    console.error(error); // Thêm dòng này để log lỗi ra console
    res
      .status(400)
      .send({ message: "Error creating Sales Race", error: error.message });
  }
};

exports.getAllRaces = async (req, res) => {
  try {
    const races = await SalesRace.find().populate({
      path: "teams.members.user", // Đường dẫn tới trường cần populate
      select: "name", // Chỉ lấy trường 'name' từ collection người dùng
    });

    res.status(200).json(races);
  } catch (error) {
    console.error("Failed to fetch races:", error);
    res
      .status(500)
      .send({ message: "Error fetching races", error: error.message });
  }
};

exports.getRaceById = async (req, res) => {
  const { id } = req.params;
  try {
    let race = await SalesRace.findById(id).populate({
      path: "teams.members.user",
      select: "name", // chỉ lấy trường 'name'
    });

    res.status(200).json(race);
  } catch (error) {
    console.error("Failed to fetch race by ID:", error);
    res
      .status(500)
      .send({ message: "Error fetching race", error: error.message });
  }
};

// Tạo team mới trong cuộc đua
exports.createTeam = async (req, res) => {
  const { raceId, teamName } = req.body;
  try {
    const race = await SalesRace.findById(raceId);
    if (!race) {
      return res.status(404).send({ message: "Sales Race not found" });
    }
    race.teams.push({ name: teamName, members: [] });
    await race.save();
    res.status(201).send({ message: "Team added successfully", race });
  } catch (error) {
    res.status(400).send({ message: "Error adding team", error });
  }
};

exports.addMemberToTeam = async (req, res) => {
  const { raceId, teamId, userId } = req.body;
  try {
    const race = await SalesRace.findById(raceId);
    if (!race) {
      return res.status(404).send({ message: "Cuộc đua không tồn tại" });
    }
    const team = race.teams.id(teamId);
    if (!team) {
      return res.status(404).send({ message: "Đội không tồn tại" });
    }

    let monthlySales = [];
    let start = moment(race.startDate).utc(); // Sử dụng UTC để tránh sai số múi giờ
    let end = moment(race.endDate).utc();

    while (start.isBefore(end) || start.isSame(end, "month")) {
      const monthStart = moment(start).startOf("month");
      const monthEnd = moment(start).endOf("month");
      const sales = await calculateSalesForMonth(
        userId,
        monthStart.toDate(),
        monthEnd.toDate()
      );
      monthlySales.push({
        month: monthStart.toDate(),
        total: sales,
      });
      start.add(1, "month");
    }

    team.members.push({
      user: userId,
      sales: monthlySales,
    });

    await race.save();
    res.status(201).send({ message: "Đã thêm thành viên thành công", race });
  } catch (error) {
    console.error("Lỗi khi thêm thành viên:", error);
    res
      .status(400)
      .send({ message: "Lỗi khi thêm thành viên", error: error.message });
  }
};

async function calculateSalesForMonth(userId, startDate, endDate) {
  const bookings = await Booking.find({
    userId: userId,
    date: { $gte: startDate, $lte: endDate },
  });

  // Tính toán tổng doanh số bằng cách cộng dồn ba trường
  return bookings.reduce((acc, booking) => {
    return acc + booking.transfer + booking.cash + booking.garageCollection;
  }, 0);
}

exports.getTeamsByRaceId = async (req, res) => {
  const { raceId } = req.params; // Lấy ID của cuộc đua từ URL parameter
  try {
    const race = await SalesRace.findById(raceId);
    if (!race) {
      return res.status(404).send({ message: "Sales Race not found" }); // Trả về lỗi nếu không tìm thấy cuộc đua
    }
    const teams = race.teams; // Lấy danh sách các đội từ cuộc đua
    res.status(200).send({ message: "Teams fetched successfully", teams }); // Trả về thông tin các đội
  } catch (error) {
    console.error("Failed to fetch teams:", error); // Log lỗi nếu có
    res
      .status(500)
      .send({ message: "Error fetching teams", error: error.message });
  }
};
// Cập nhật KPI của thành viên trong nhóm
exports.updateMemberKPI = async (req, res) => {
  const { raceId, teamId, memberId } = req.params;
  const { newKPI } = req.body;

  try {
    const race = await SalesRace.findById(raceId);
    if (!race) {
      return res.status(404).send({ message: "Sales Race not found" });
    }

    const team = race.teams.id(teamId);
    if (!team) {
      return res.status(404).send({ message: "Team not found" });
    }

    const member = team.members.id(memberId);
    if (!member) {
      return res.status(404).send({ message: "Member not found" });
    }

    member.KPI = newKPI;
    await race.save();
    res
      .status(200)
      .send({ message: "Member KPI updated successfully", member });
  } catch (error) {
    console.error("Failed to update member KPI:", error);
    res
      .status(500)
      .send({ message: "Error updating member KPI", error: error.message });
  }
};
// Xóa thành viên khỏi nhóm
exports.removeMemberFromTeam = async (req, res) => {
  const { raceId, teamId, memberId } = req.params;

  try {
    const race = await SalesRace.findById(raceId);
    if (!race) {
      return res.status(404).send({ message: "Sales Race not found" });
    }

    const team = race.teams.id(teamId);
    if (!team) {
      return res.status(404).send({ message: "Team not found" });
    }

    const member = team.members.id(memberId);
    if (!member) {
      return res.status(404).send({ message: "Member not found" });
    }

    member.remove();
    await race.save();
    res.status(200).send({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Failed to remove member:", error);
    res
      .status(500)
      .send({ message: "Error removing member", error: error.message });
  }
};

exports.updateSalesKPI = async (req, res) => {
  const { raceId, teamId, memberId, salesId } = req.params;
  const { newKPI } = req.body;

  try {
    const race = await SalesRace.findById(raceId);
    if (!race) {
      return res.status(404).send({ message: "Sales Race not found" });
    }

    const team = race.teams.id(teamId);
    if (!team) {
      return res.status(404).send({ message: "Team not found" });
    }

    const member = team.members.id(memberId);
    if (!member) {
      return res.status(404).send({ message: "Member not found" });
    }

    const salesEntry = member.sales.id(salesId);
    if (!salesEntry) {
      return res.status(404).send({ message: "Sales entry not found" });
    }

    salesEntry.KPI = newKPI; // Cập nhật KPI
    await race.save(); // Lưu thay đổi vào cơ sở dữ liệu
    res.status(200).send({ message: "KPI updated successfully", salesEntry });
  } catch (error) {
    console.error("Failed to update KPI:", error);
    res
      .status(500)
      .send({ message: "Error updating KPI", error: error.message });
  }
};
