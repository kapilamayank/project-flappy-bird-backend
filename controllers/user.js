const mongoose = require("mongoose");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { isValidObjectId } = require("../utils/db");

async function handleUserSignUp(req, res) {
  const { email, userName } = req.body;

  if (!email || !userName) {
    return res.status(400).json({ errorMessage: "Enter username and email" });
  }

  const userEmailExists = await User.findOne({ email });
  const userNameExists = await User.findOne({ userName });

  if (userEmailExists) {
    return res
      .status(400)
      .json({ errorMessage: "Account with email already exists" });
  }
  if (userNameExists) {
    return res.status(400).json({ errorMessage: `${userName} was taken` });
  }

  const newUser = new User({ email, userName });
  await newUser.save();

  return res.status(201).json({ successMessage: "User created successfully!" });
}

async function handleUserLogin(req, res) {
  const { email } = req.body;

  const foundUser = await User.findOne({ email });

  if (!foundUser)
    return res
      .status(400)
      .json({ errorMessage: "User with email does not exist" });

  const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET);

  res.cookie("accessToken", accessToken, {
    httpOnly: true, // Ensures the cookie is inaccessible to JavaScript
    secure: true, // Set to true in production with HTTPS
    sameSite: "None", // Allows cross-origin cookies to be sent
    path: "/",
  });

  return res.status(200).json({
    successMessage: "Logged in successfully!",
    accessToken: accessToken,
  });
}

async function handleSendingFriendRequests(req, res) {
  const friendEmail = req.body.email;

  if (!friendEmail) {
    return res
      .status(400)
      .json({ errorMessage: "User with this email does not exist" });
  }

  const initiatorUserAccessToken = req.cookies?.accessToken;

  if (!initiatorUserAccessToken) {
    return res.status(401).json({ errorMessage: "Not logged in" });
  }

  let initiatorUserEmail;
  try {
    const initiatorUserPayload = jwt.verify(
      initiatorUserAccessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    initiatorUserEmail = initiatorUserPayload.email;
  } catch (err) {
    return res
      .status(401)
      .json({ errorMessage: "Invalid access token, relogin" });
  }

  if (friendEmail === initiatorUserEmail) {
    return res
      .status(400)
      .json({ errorMessage: "Can't send requests to yourself" });
  }

  const [initiatorUser, friendUser] = await Promise.all([
    User.findOne({ email: initiatorUserEmail }),
    User.findOne({ email: friendEmail }),
  ]);

  if (!friendUser) {
    return res.status(400).json({ errorMessage: "Wrong user email!" });
  }

  if (initiatorUser.friends.includes(friendUser._id)) {
    return res.status(400).json({ errorMessage: "Already a friend" });
  }

  if (!friendUser) {
    return res.status(400).json({ errorMessage: "User does not exist" });
  }

  const initiatorUserId = initiatorUser._id;

  await User.updateOne(
    { email: friendEmail },
    { $addToSet: { friendRequests: initiatorUserId } }
  );
  // this will add the friend request if it does not already exist

  return res.status(200).json({ successMessage: "Friend request sent!" });
}

async function handleAcceptFriendRequest(req, res) {
  const friendId = req.body.friendId;

  if (isValidObjectId(friendId) === false) {
    return res.status(401).json({ errorMessage: "Invalid friendId" });
  }

  const friendUser = await User.findById(friendId);
  if (!friendUser) {
    return res.status(404).json({ errorMessage: "Invalid user id" });
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
    return res.status(401).json({ errorMessage: "Log in again!" });
  }

  const currentUser = await User.findOne({ email: userEmail });

  if (!currentUser.friendRequests.includes(friendId)) {
    return res.status(404).json({ errorMessage: "No such friend request" });
  }

  await User.updateOne(
    { email: userEmail },
    { $addToSet: { friends: friendId } }
  );
  await User.updateOne(
    { email: userEmail },
    { $pull: { friendRequests: friendId } }
  );
  await User.findByIdAndUpdate(friendId, {
    $addToSet: { friends: currentUser._id },
  });

  return res.status(200).json({ successMessage: "Friend added!" });
}

async function handleDeclineFriendRequest(req, res) {
  const friendId = req.body.friendId;
  if (!isValidObjectId(friendId)) {
    return res.status(401).json({ errorMessage: "Invalid friendId" });
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
    return res.status(401).json({ errorMessage: "Log in again!" });
  }

  const currentUser = await User.findOne({ email: userEmail });

  if (!currentUser.friendRequests.includes(friendId)) {
    return res.status(404).json({ errorMessage: "No such friend request" });
  }

  await User.updateOne(
    { email: userEmail },
    { $pull: { friendRequests: friendId } }
  );

  return res.status(200).json({ successMessage: "Friend request declined" });
}

async function handleGetFriends(req, res) {
  const accessToken = req.cookies?.accessToken;
  if (!accessToken) {
    return res.status(401).json({ errorMessage: "Log in again!" });
  }

  let userEmail;
  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    userEmail = payload.email;
  } catch (err) {
    return res.status(401).json({ errorMessage: "Log in again! --> payload" });
  }

  const currentUser = await User.findOne({ email: userEmail }).populate(
    "friends",
    "userName maxScore"
  );

  let sortedFriends = [
    ...currentUser.friends,
    {
      _id: currentUser._id,
      userName: "You",
      maxScore: currentUser.maxScore,
    },
  ];
  sortedFriends = sortedFriends.sort((a, b) => b.maxScore - a.maxScore);

  return res.status(200).json(sortedFriends);
}

async function handleUserAddScore(req, res) {
  const newScore = req.body.score;

  const accessToken = req.cookies?.accessToken;
  if (!accessToken) {
    return res.status(401).json({ errorMessage: "Log in again!" });
  }

  let userEmail;
  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    userEmail = payload.email;
  } catch (err) {
    return res.status(401).json({ errorMessage: "Log in again!" });
  }

  const currentUser = await User.findOne({ email: userEmail });
  currentUser.checkForMaxScore(newScore);

  return res.sendStatus(200);
}

async function handleGetFriendRequests(req, res) {
  const accessToken = req.cookies?.accessToken;
  if (!accessToken) {
    return res.status(401).json({ errorMessage: "Log in again!" });
  }

  let userEmail;
  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    userEmail = payload.email;
  } catch (err) {
    return res.status(401).json({ errorMessage: "Log in again!" });
  }

  const currentUser = await User.findOne({ email: userEmail }).populate({
    path: "friendRequests",
    select: "userName",
  });
  let userFriendRequests = currentUser.friendRequests;
  userFriendRequests = userFriendRequests.reverse();

  return res.status(200).json(userFriendRequests);
}

module.exports = {
  handleUserSignUp,
  handleUserLogin,
  handleSendingFriendRequests,
  handleAcceptFriendRequest,
  handleDeclineFriendRequest,
  handleGetFriends,
  handleUserAddScore,
  handleGetFriendRequests,
};
