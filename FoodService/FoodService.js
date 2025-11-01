const express = require("express");
const router = express.Router();
const db = require("../database/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

const rateLimiter = require("express-rate-limit");
const { authenticate, numberChecker, checker } = require("../utils.js");

const FoodAddLimiter = rateLimiter({
  windowMs: 30000, //each 5 mins,
  max: 10,
  message: "Too many Requests, please try again later",
});
//add

const updateRouter = require("./UpdateFoodMicroservice/UpdateFoodMicroservice.js");
const consumedRouter = require("./UpdateConsumedFoodMicroservice/UpdateConsumedFoodMicroservice.js");
router.use("/update", updateRouter);
router.use("/consumed", consumedRouter);
router.post("/create", authenticate, async (req, res) => {
  try {
    console.log("food create");
    const { kcal, protein, carbs, name, portion } = req.body;
    const id = req.user.id;
    if (
      !checker([name]) ||
      !numberChecker([kcal, protein, carbs, portion]) ||
      kcal < 0 ||
      protein < 0 ||
      carbs < 0 ||
      parseInt(portion) <= 0
    ) {
      return res.json({
        status: 400,
        ok: 0,
        message: "Input Missing / Error",
      });
    }
    const result = await db.query(
      "INSERT INTO foods (calories,protein,carbs,name,userid,portion) VALUES($1,$2,$3,$4,$5,$6);",
      [kcal, protein, carbs, name, id, portion]
    );
    if (result.rowCount > 0) {
      //all good
      return res.json({
        status: 200,
        ok: 1,
        message: `${name} Successfully Added`,
      });
    } else {
      return res.json({
        status: 500,
        ok: 0,
        message: "Server Error",
      });
    }
  } catch (e) {
    console.log(e.message + " " + e.stack);
    return res.json({
      status: 500,
      ok: 0,
      message: "Server Error",
    });
  }
});

router.get("/read", authenticate, async (req, res) => {
  try {
    console.log("food get");

    const id = req.user.id;
    console.log(id);
    const resultNotConsumed = await db.query(
      "SELECT * FROM foods WHERE userid=$1 AND id NOT IN (SELECT id FROM consumed_foods WHERE userid=$1) ;",
      [id]
    );
    ///console.log(result.rows.length);
    if (resultNotConsumed.rowCount > 0) {
      //all good

      // filter

      return res.json({
        status: 201,
        ok: 1,
        data: resultNotConsumed.rows,
        message: `food Successfully Pulled`,
      });
    } else {
      return res.json({
        status: 500,
        ok: 0,
        message: "Internal Error",
      });
    }
  } catch (e) {
    console.log(e.message + " " + e.stack);
    return res.json({
      status: 500,
      ok: 0,
      message: "Server Error",
    });
  }
});
router.post("/delete", authenticate, async (req, res) => {
  try {
    console.log("food delete");

    const id = req.user.id;
    const { foodId } = req.body;
    const result = await db.query(
      "DELETE  FROM consumed_foods WHERE userid=$1 AND id=$2 ;",
      [id, foodId]
    );
    const resultNotConsumed = await db.query(
      "DELETE  FROM foods WHERE userid=$1 AND id=$2 ;",
      [id, foodId]
    );
    ///console.log(result.rows.length);
    console.log(resultNotConsumed.rowCount);
    console.log(result.rowCount);
    if (resultNotConsumed.rowCount > 0 || result.rowCount > 0) {
      //all good

      // filter

      return res.json({
        status: 201,
        ok: 1,
        data: resultNotConsumed.rows,
        message: `food Successfully deleted`,
      });
    } else {
      return res.json({
        status: 500,
        ok: 0,
        message: "Internal Error",
      });
    }
  } catch (e) {
    console.log(e.message + " " + e.stack);
    return res.json({
      status: 500,
      ok: 0,
      message: "Server Error",
    });
  }
});
router.get("/update", async (req, res) => {});

router.post(
  "/upload",

  upload.single("image"),
  async (req, res) => {
    if (!req.file) return res.status(400).send("No image uploaded.");

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    try {
      const { runAi } = await import("../AI_service/Ai_image_servicem.mjs");
      const result = await runAi(imageUrl);
      console.log(imageUrl);
      console.log(result);
      // Clean up image after processing

      return res.json({ data: result, ok: 1, message: "Image Detected" });
    } catch (err) {
      console.error("AI Error:", err);
      return res.json({ ok: 0, message: "error uploading image" });
    } finally {
      fs.unlinkSync(req.file.path);
      console.log("image deleted");
    }
  }
);
module.exports = router;
