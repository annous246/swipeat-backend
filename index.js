const express = require("express");
app = express();
const bp = require("body-parser");
const cors = require("cors");
const http = require("http");
const path = require("path");
const socketBuilder = require("socket.io");
const server = http.createServer(app);
const io = socketBuilder(server);
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many Requests, please try again later",
});
const AuthRouter = require("./Authentication_service/auth");
const StarterRouter = require("./Starter_service/starter");
const foodRouter = require("./FoodService/FoodService");
const macroRouter = require("./MacroService/MacroGoalsService");
const macroProgressRouter = require("./MacroService/MacroProgressService");
server.listen(process.env.PORT, () =>
  console.log(`listening on port ${process.env.PORT}`)
);

app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

app.use(cors());
app.use(express.static("public"));
/*const fl = async () => {
  const { runAi } = await import("./AI_service/Ai_image_servicem.mjs");
  const res = await runAi(
    "https://www.foodiesfeed.com/wp-content/uploads/2023/06/burger-with-melted-cheese.jpg"
  );
  console.log(res);
};
fl();*/
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/auth", AuthRouter);

app.use("/starter", StarterRouter);

app.use("/foods", foodRouter);

app.use("/macros", macroRouter);

app.use("/progress", macroProgressRouter);
app.get("/", (req, res) => {
  res.json({ message: "listening" });
});
