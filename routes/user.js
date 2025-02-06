const { Router } = require("express");
require("dotenv").config();

const User = require("../models/user");
const {
  handleUserSignUp,
  handleUserLogin,
  handleSendingFriendRequests,
  handleAcceptFriendRequest,
  handleDeclineFriendRequest,
  handleGetFriends,
  handleUserAddScore,
  handleGetFriendRequests,
} = require("../controllers/user");
const jwt = require("jsonwebtoken");
const { isValidObjectId } = require("../utils/db");

const router = Router();

router.post("/signup", handleUserSignUp);
router.post("/login", handleUserLogin);
router.post("/addScore", handleUserAddScore);

router.post("/sendFriendRequest", handleSendingFriendRequests);
router.post("/acceptFriendRequest", handleAcceptFriendRequest);
router.post("/declineFriendRequest", handleDeclineFriendRequest);

router.get("/friends", handleGetFriends);
router.get("/friendRequests", handleGetFriendRequests);

module.exports = router;
