const { Schema, model } = require("mongoose");

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  friends: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  friendRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  scores: [
    {
      type: Number,
    },
  ],
  maxScore: {
    type: Number,
    default: 0,
  },
});

UserSchema.methods.checkForMaxScore = async function (newScore) {
  this.maxScore = Math.max(this.maxScore, newScore);

  await this.save();
};

const User = model("user", UserSchema);

module.exports = User;
