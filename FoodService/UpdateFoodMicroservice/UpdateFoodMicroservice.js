const express = require("express");
const router = express.Router();

const db = require("../../database/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { authenticate, numberChecker, checker } = require("../../utils.js");

router.post("/update_calories", authenticate, async (req, res) => {
  const { id, calories } = req.body;
  console.log(id);
  console.log(calories);
  if (
    calories != undefined &&
    numberChecker([calories]) &&
    id &&
    calories > -1
  ) {
    const result = await db.query("UPDATE foods SET calories=$1 WHERE id=$2", [
      calories,
      id,
    ]);

    if (result.rowCount > 0) {
      //all good

      return res.json({
        status: 201,
        ok: 1,
        message: "Calories Successfully updated",
      });
    } else {
      return res.json({
        status: 500,
        ok: 0,
        message: "Internal Error",
      });
    }
  } else {
    return res.json({
      status: 400,
      ok: 0,
      message: "Input Missing / Error",
    });
  }
});

router.post("/update_protein", authenticate, async (req, res) => {
  const { id, protein } = req.body;
  if (protein != undefined && numberChecker([protein]) && id && protein > -1) {
    const result = await db.query("UPDATE foods SET protein=$1 WHERE id=$2", [
      protein,
      id,
    ]);

    if (result.rowCount > 0) {
      //all good

      return res.json({
        status: 201,
        ok: 1,
        message: "Protein Successfully updated",
      });
    } else {
      return res.json({
        status: 500,
        ok: 0,
        message: "Internal Error",
      });
    }
  } else {
    return res.json({
      status: 400,
      ok: 0,
      message: "Input Missing / Error",
    });
  }
});

router.post("/update_carbs", authenticate, async (req, res) => {
  const { id, carbs } = req.body;
  if (carbs != undefined && numberChecker([carbs]) && id && carbs > -1) {
    const result = await db.query("UPDATE foods SET carbs=$1 WHERE id=$2", [
      carbs,
      id,
    ]);

    if (result.rowCount > 0) {
      //all good

      return res.json({
        status: 201,
        ok: 1,
        message: "carbs Successfully updated",
      });
    } else {
      return res.json({
        status: 500,
        ok: 0,
        message: "Internal Error",
      });
    }
  } else {
    return res.json({
      status: 400,
      ok: 0,
      message: "Input Missing / Error",
    });
  }
});

router.post("/update_portion", authenticate, async (req, res) => {
  const { id, portion } = req.body;
  if (portion != undefined && numberChecker([portion]) && id && portion > 0) {
    const oldRes = await db.query("SELECT * FROM foods WHERE id=$1", [id]);
    const oldPortion = oldRes.rows[0].portion ?? portion;
    const oldProtein = oldRes.rows[0].protein;
    const oldCarbs = oldRes.rows[0].carbs;
    const oldCalories = oldRes.rows[0].calories;
    const result = await db.query("UPDATE foods SET portion=$1 WHERE id=$2", [
      portion,
      id,
    ]);
    await db.query("UPDATE foods SET carbs=$1 WHERE id=$2", [
      (oldCarbs * parseFloat(portion / oldPortion)).toFixed(2),
      id,
    ]);

    await db.query("UPDATE foods SET protein=$1 WHERE id=$2", [
      (oldProtein * parseFloat(portion / oldPortion)).toFixed(2),
      id,
    ]);

    await db.query("UPDATE foods SET calories=$1 WHERE id=$2", [
      (oldCalories * parseFloat(portion / oldPortion)).toFixed(2),
      id,
    ]);

    if (result.rowCount > 0) {
      //all good

      return res.json({
        status: 201,
        ok: 1,
        message: "portion Successfully updated",
      });
    } else {
      return res.json({
        status: 500,
        ok: 0,
        message: "Internal Error",
      });
    }
  } else {
    return res.json({
      status: 400,
      ok: 0,
      message: "Input Missing / Error",
    });
  }
});

module.exports = router;
