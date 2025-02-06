const { Router } = require("express");
const {
  handleGetAllScores,
  handleAddNewScore,
} = require("../controllers/globalScore");

const router = Router();

router.get("/", handleGetAllScores);
router.post("/", handleAddNewScore);

module.exports = router;
