const express = require("express");
const router = express.Router();

const db = require("../database/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { authenticate, numberChecker, checker } = require("../utils.js");

router.get("/read", authenticate, async (req, res) => {
  try {
    const id = req.user.id;
    console.log(id);
    const result = await db.query("SELECT * FROM macro_goals WHERE userid=$1", [
      id,
    ]);
    ///console.log(result.rows.length);
    if (result.rowCount > 0) {
      //all good
      console.log(result);

      return res.json({
        status: 201,
        ok: 1,
        data: result.rows[0],
        message: `food Successfully Pulled`,
      });
    } else {
      return res.json({
        status: 201,
        ok: 1,
        data: { calories_goal: 0.0, protein_goal: 0.0, carbs_goal: 0.0 },
        message: `food Successfully Pulled Initial`,
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
router.post("/update_calories_goal", authenticate, async (req, res) => {
  const { calories, c } = req.body;
  const id = req.user.id;
  console.log(c);
  if (
    calories != undefined &&
    numberChecker([calories]) &&
    id &&
    calories > -1
  ) {
    const result = await db.query(
      "UPDATE macro_goals SET calories_goal=$1 WHERE userid=$2",
      [calories, id]
    );
    const exists = await db.query(
      "SELECT * FROM macro_goals WHERE userid=$1 ",
      [id]
    );
    if (result.rowCount > 0) {
      //all good

      return res.json({
        status: 201,
        ok: 1,
        message: "Calories goal Successfully updated",
      });
    } else if (exists.rowCount == 0) {
      const result = await db.query(
        "INSERT INTO macro_goals (calories_goal,userid) VALUES($1,$2)",
        [calories, id]
      );
      if (result.rowCount > 0) {
        //all good

        return res.json({
          status: 201,
          ok: 1,
          message: "calories goal Successfully updated",
        });
      }
      return res.json({
        status: 500,
        ok: 0,
        message: "Internal Error",
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

router.post("/update_protein_goal", authenticate, async (req, res) => {
  const { protein } = req.body;
  const id = req.user.id;
  if (protein != undefined && numberChecker([protein]) && id && protein > -1) {
    const exists = await db.query(
      "SELECT * FROM macro_goals WHERE userid=$1 ",
      [id]
    );
    const result = await db.query(
      "UPDATE macro_goals SET protein_goal=$1 WHERE userid=$2",
      [protein, id]
    );
    console.log(protein);
    console.log(id);
    if (result.rowCount > 0) {
      //all good

      return res.json({
        status: 201,
        ok: 1,
        message: "Protein goal Successfully updated",
      });
    } else if (exists.rowCount == 0) {
      const result = await db.query(
        "INSERT INTO macro_goals (protein_goal,userid) VALUES($1,$2)",
        [protein, id]
      );
      if (result.rowCount > 0) {
        //all good

        return res.json({
          status: 201,
          ok: 1,
          message: "Protein goal Successfully updated",
        });
      }
      return res.json({
        status: 500,
        ok: 0,
        message: "Internal Error",
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

router.post("/update_carbs_goal", authenticate, async (req, res) => {
  const { carbs } = req.body;
  const id = req.user.id;
  if (carbs != undefined && numberChecker([carbs]) && id && carbs > -1) {
    const result = await db.query(
      "UPDATE macro_goals SET carbs_goal=$1 WHERE userid=$2",
      [carbs, id]
    );
    const exists = await db.query(
      "SELECT * FROM macro_goals WHERE userid=$1 ",
      [id]
    );
    if (result.rowCount > 0) {
      //all good

      return res.json({
        status: 201,
        ok: 1,
        message: "carbs Successfully updated",
      });
    } else if (exists.rowCount == 0) {
      const result = await db.query(
        "INSERT INTO macro_goals (carbs_goal,userid) VALUES($1,$2)",
        [carbs, id]
      );
      if (result.rowCount > 0) {
        //all good

        return res.json({
          status: 201,
          ok: 1,
          message: "carbs goal Successfully updated",
        });
      }
      return res.json({
        status: 500,
        ok: 0,
        message: "Internal Error",
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
