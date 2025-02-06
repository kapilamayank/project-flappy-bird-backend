const { model, Schema } = require("mongoose");

const globalScoreBoardSchema = new Schema({
  playerName: {
    type: String,
    required: true,
  },
  playerScore: {
    type: Number,
    required: true,
  },
});

globalScoreBoardSchema.statics.getMinScorer = function () {
  return this.findOne().sort({ playerScore: 1 }).exec();
};

globalScoreBoardSchema.statics.getAll = function () {
  return this.find({}).sort({ playerScore: -1 }).exec();
};

globalScoreBoardSchema.statics.insertEntry = async function (entry) {
  const { userName, score } = entry;
  const minScorer = await this.getMinScorer();
  const players = await this.getAll();
  if (players.length < 50) {
    await this.create({ playerName: userName, playerScore: score });
    return;
  }

  if (score <= minScorer.playerScore) {
    return;
  }

  await this.deleteOne({ playerName: minScorer.playerName });
  await this.create({ playerName: userName, playerScore: score });
};

const GlobalScoreBoard = new model("globalscore", globalScoreBoardSchema);

module.exports = GlobalScoreBoard;
