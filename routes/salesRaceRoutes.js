const express = require("express");
const router = express.Router();
const salesRaceController = require("../controllers/salesRaceController"); // Đảm bảo bạn đã tạo các controller này

router.get("/", salesRaceController.getAllRaces);
// POST request to create a new SalesRace
router.post("/create", salesRaceController.createRace);

// POST request to create a team in a SalesRace
router.post("/create-team", salesRaceController.createTeam);

// POST request to add a member to a team
router.post("/team/member", salesRaceController.addMemberToTeam);

router.get("/:id", salesRaceController.getRaceById);
router.get("/races/:raceId/teams", salesRaceController.getTeamsByRaceId);
router.put(
  "/:raceId/:teamId/:memberId/:salesId",
  salesRaceController.updateSalesKPI
);

router.delete(
  "/:raceId/teams/:teamId/members/:memberId",
  salesRaceController.removeMemberFromTeam
);

module.exports = router;
