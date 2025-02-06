const GlobalScoreBoard = require("../models/globalScore.js");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function handleGetAllScores(req, res) {
  const allScores = await GlobalScoreBoard.getAll();
  return res.status(200).json(allScores);
}

async function handleAddNewScore(req, res) {
  const { score } = req.body;
  if (!score) {
    return res.status(400).json({ errorMessage: "No score" });
  }

  const accessToken = req.cookies?.accessToken;
  if (!accessToken) {
    return res.status(401).json({ errorMessage: "Log in again!" });
  }

  let userEmail;
  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    userEmail = payload.email;
  } catch (err) {
    return res.status(401).json({ errorMessage: "Log in again" });
  }

  const currentUser = await User.findOne({ email: userEmail });
  const userName = currentUser.userName;

  GlobalScoreBoard.insertEntry({ userName, score });
  return res.status(200).json({ successMessage: "Score added!" });
}

module.exports = { handleGetAllScores, handleAddNewScore };
