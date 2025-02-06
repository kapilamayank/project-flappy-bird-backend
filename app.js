require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const userRouter = require("./routes/user");
const globalScoreRouter = require("./routes/globalScore");

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.log("Mongo Error", err));

const app = express();
const PORT = process.env.PORT || 8000;

//middlewares:
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: "https://project-flappy-bird-frontend-vcl5e48mx-mayank-kapilas-projects.vercel.app", // Frontend origin
  credentials: true, // Allow cookies to be sent
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // for pre-flight requests..
//routes:
app.use("/user", userRouter);
app.use("/globalScore", globalScoreRouter);

app.listen(PORT, () => console.log("Server started at PORT: " + PORT));

//// SENDING AND ACCEPTING FRIEND REQUESTS (gotta update the user model....)
//// dealing with userScores (adding the score of the user after a game)
