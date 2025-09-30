const express = require("express");
const router = express.Router();

const db = require("../database/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { authenticate, numberChecker, checker } = require("../utils.js");
router.post("/reset", authenticate, async (req, res) => {
  try {
    const id = req.user.id;
    const pastDate = new Date(JSON.parse(req.body.PastDate));
    console.log("pastDate");
    console.log(pastDate);
    const dateOnly = pastDate.toISOString().split("T")[0];
    console.log(pastDate.getDate());
    console.log(pastDate.getMonth());
    console.log(pastDate.getFullYear());
    console.log(id);
    const goal = await db.query("SELECT * FROM users WHERE id=$1", [id]);
    if (goal.rowCount == 0) {
      //no need to reset nothing
      return res.json({
        status: 201,
        ok: 1,
        data: {},
        message: `progress Successfully Reset`,
      });
    }
    const proteinGoal = goal.rows[0]["protein_progress"];
    const carbsGoal = goal.rows[0]["carbs_progress"];
    const caloriesGoal = goal.rows[0]["calories_progress"];

    await db.query("begin");
    //security deletion for multiple resets per day
    await db.query(
      "DELETE FROM past_macro_goals WHERE progress_date=$1 AND userid=$2 ",
      [dateOnly, id]
    );

    const pastProgress = await db.query(
      "INSERT INTO past_macro_goals (protein_goal,carbs_goal,calories_goal,progress_date,userid) VALUES($1,$2,$3,$4,$5) ",
      [proteinGoal, carbsGoal, caloriesGoal, dateOnly, id]
    );
    const result = await db.query(
      "UPDATE  users SET calories_progress=0.0 ,protein_progress=0.0,carbs_progress=0.0,last_reset=$2 WHERE id=$1",
      [id, new Date().toISOString()]
    );
    ///console.log(result.rows.length);
    if (result.rowCount > 0) {
      //all good
      console.log(result);
      console.log(result.rows[0]);
      await db.query("COMMIT");
      return res.json({
        status: 201,
        ok: 1,
        data: {},
        message: `progress Successfully Reset`,
      });
    } else {
      await db.query("ROLLBACK");
      return res.json({
        status: 500,
        ok: 0,
        message: "Internal Error",
      });
    }
  } catch (e) {
    console.log(e.message + " " + e.stack);
    await db.query("ROLLBACK");
    return res.json({
      status: 500,
      ok: 0,
      message: "Server Error",
    });
  }
});

router.get("/readPast", authenticate, async (req, res) => {
  try {
    const id = req.user.id;
    const day = req.query.day;
    const month = req.query.month;
    const year = req.query.year;
    if (!numberChecker([day, month, year]))
      return res.json({
        status: 400,
        ok: 0,
        message: "Input Error",
      });
    let date = `${year}-`;
    date += month < 10 ? "0" + month.toString() : month.toString();
    date += "-";
    date += day < 10 ? "0" + day.toString() : day.toString();
    if (id) {
      const result = await db.query(
        "SELECT * FROM past_macro_goals WHERE userid=$1 AND progress_date=$2",
        [id, date]
      );
      if (result.rowCount > 0) {
        //all good

        return res.json({
          status: 201,
          ok: 1,
          data: {
            protein_progress: result.rows[0].protein_goal,
            carbs_progress: result.rows[0].carbs_goal,
            calories_progress: result.rows[0].calories_goal,
          },
          message: "Past progress pulled",
        });
      } else {
        return res.json({
          status: 200,
          ok: 1,
          message: "No progress this day",
        });
      }
    } else {
      return res.json({
        status: 400,
        ok: 0,
        message: "Input Missing / Error",
      });
    }
  } catch (e) {}
});

router.get("/read", authenticate, async (req, res) => {
  try {
    const id = req.user.id;
    console.log(id);
    const result = await db.query("SELECT * FROM users WHERE id=$1", [id]);
    ///console.log(result.rows.length);
    if (result.rowCount > 0) {
      //all good
      console.log(result);
      console.log(result.rows[0]);
      return res.json({
        status: 201,
        ok: 1,
        data: {
          calories_progress: result.rows[0].calories_progress,
          carbs_progress: result.rows[0].carbs_progress,
          protein_progress: result.rows[0].protein_progress,
        },
        message: `progress Successfully Pulled`,
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
router.post("/update_progress", authenticate, async (req, res) => {
  try {
    const { calories, carbs, protein } = req.body;
    const id = req.user.id;
    if (
      calories != undefined &&
      numberChecker([calories]) &&
      id &&
      calories > -1 &&
      carbs != undefined &&
      numberChecker([carbs]) &&
      id &&
      carbs > -1 &&
      protein != undefined &&
      numberChecker([protein]) &&
      id &&
      protein > -1
    ) {
      const result = await db.query(
        "UPDATE users SET calories_progress=calories_progress+$1,carbs_progress=carbs_progress+$3,protein_progress=protein_progress+$4 WHERE id=$2",
        [calories, id, carbs, protein]
      );
      if (result.rowCount > 0) {
        return res.json({
          status: 201,
          ok: 1,
          message: "macros Updated",
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
  } catch (e) {
    console.log(e.message + " " + e.stack);
  }
});

async function pullDaily(daily, id, element) {
  try {
    const now = new Date();
    for (let p = 1; p <= 7; p++) {
      const thatDay = new Date();
      thatDay.setDate(now.getDate() - p);
      const convertedDate = `${thatDay.getFullYear()}-${String(
        thatDay.getMonth() + 1
      ).padStart(2, "0")}-${String(thatDay.getDate()).padStart(2, "0")}`;
      console.log(convertedDate);
      let result = await db.query(
        `SELECT AVG(${element}_goal),SUM(${element}_goal) FROM past_macro_goals WHERE userid=$1 GROUP BY progress_date HAVING progress_date=$2 `,
        [id, convertedDate]
      );

      console.log(result.rowCount);
      if (result.rowCount) daily[convertedDate] = result.rows[0];
      else daily[convertedDate] = { avg: 0, sum: 0 };
      console.log(daily);
    }
  } catch (e) {}
}

async function pullWeekly(weekly, id, element) {
  try {
    console.log("thatDay");
    const now = new Date();
    now.setDate(now.getDate() - 1);
    console.log("thatDay");
    for (let p = 0; p < 4; p++) {
      const thatDay = new Date();
      thatDay.setDate(now.getDate() - 7 * (p + 1));
      const lastDay = new Date(thatDay);
      const firstDay = new Date(thatDay);
      firstDay.setDate(thatDay.getDate() + 1);
      lastDay.setDate(thatDay.getDate() + 7);
      console.log(thatDay);
      console.log(firstDay);
      console.log(lastDay);
      const convertedLeftDate = `${firstDay.getFullYear()}-${String(
        firstDay.getMonth() + 1
      ).padStart(2, "0")}-${String(firstDay.getDate()).padStart(2, "0")}`;

      const convertedRightDate = `${lastDay.getFullYear()}-${String(
        lastDay.getMonth() + 1
      ).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
      console.log(convertedLeftDate);
      console.log(convertedRightDate);
      let result = await db.query(
        `SELECT AVG(${element}_goal),SUM(${element}_goal) FROM past_macro_goals WHERE userid=$1 AND progress_date BETWEEN $2 AND $3`,
        [id, convertedLeftDate, convertedRightDate]
      );
      console.log(result.rowCount);
      if (result.rowCount && result.rows[0]["avg"])
        weekly["week" + (p + 1)] = result.rows[0];
      else weekly["week" + (p + 1)] = { avg: 0, sum: 0 };
      console.log(weekly);
    }
  } catch (e) {
    console.log(e.message);
  }
}

async function pullMonthly(monthly, id, element) {
  try {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    for (let p = 0; p < 12; p++) {
      const thatDay = new Date();
      thatDay.setMonth(now.getMonth() - p);
      let result = await db.query(
        `SELECT AVG(${element}_goal),SUM(${element}_goal) FROM past_macro_goals WHERE userid=$1 AND EXTRACT(MONTH FROM progress_date) = $2 AND EXTRACT(YEAR FROM progress_date) = $3 `,
        [id, thatDay.getMonth() + 1, thatDay.getFullYear()]
      );
      const converted =
        String(thatDay.getFullYear()) +
        "-" +
        String(thatDay.getMonth() + 1).padStart(2, "0");
      if (result.rowCount && result.rows[0]["avg"])
        monthly[converted] = result.rows[0];
      else monthly[converted] = { avg: 0, sum: 0 };
      console.log(monthly);
    }
  } catch (e) {}
}

async function pullYearly(yearly, id, element) {
  try {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    for (let p = 0; p < 5; p++) {
      const thatDay = new Date();
      thatDay.setYear(now.getFullYear() - p);
      let result = await db.query(
        `SELECT AVG(${element}_goal),SUM(${element}_goal) FROM past_macro_goals WHERE userid=$1 AND EXTRACT(YEAR FROM progress_date) = $2 `,
        [id, thatDay.getFullYear()]
      );
      const converted = String(thatDay.getFullYear());
      if (result.rowCount && result.rows[0]["avg"])
        yearly[converted] = result.rows[0];
      else yearly[converted] = { avg: 0, sum: 0 };
      console.log(yearly);
    }
  } catch (e) {}
}
router.post("/calories_metrics", authenticate, async (req, res) => {
  try {
    const id = req.user.id;
    let daily = {};
    let monthly = {};
    let yearly = {};
    let weekly = {};
    if (id) {
      //ik average / total day isnt logic , dont rant its sjust for some testing
      //pull average/total by week (past week)

      await pullDaily(daily, id, "calories");
      //pull average/total by week (past )
      await pullWeekly(weekly, id, "calories");
      //pull average/total by month (past )
      await pullMonthly(monthly, id, "calories");
      //pull average/total by year
      await pullYearly(yearly, id, "calories");
      //pull all time average/total

      //all good
      return res.json({
        status: 201,
        ok: 1,
        data: {
          monthly: monthly,
          yearly: yearly,
          daily: daily,
          weekly: weekly,
        },
        message: "calories metrics pulled",
      });
    } else {
      return res.json({
        status: 400,
        ok: 0,
        message: "Input Missing / Error",
      });
    }
  } catch (e) {}
});

router.post("/carbs_metrics", authenticate, async (req, res) => {
  try {
    const id = req.user.id;
    let daily = {};
    let monthly = {};
    let yearly = {};
    let weekly = {};
    if (id) {
      //ik average / total day isnt logic , dont rant its sjust for some testing
      //pull average/total by week (past week)

      await pullDaily(daily, id, "carbs");
      //pull average/total by week (past )
      await pullWeekly(weekly, id, "carbs");
      //pull average/total by month (past )
      await pullMonthly(monthly, id, "carbs");
      //pull average/total by year
      await pullYearly(yearly, id, "carbs");
      //pull all time average/total

      //all good
      return res.json({
        status: 201,
        ok: 1,
        data: {
          monthly: monthly,
          yearly: yearly,
          daily: daily,
          weekly: weekly,
        },
        message: "calories metrics pulled",
      });
    } else {
      return res.json({
        status: 400,
        ok: 0,
        message: "Input Missing / Error",
      });
    }
  } catch (e) {}
});

router.post("/protein_metrics", authenticate, async (req, res) => {
  try {
    const id = req.user.id;
    let daily = {};
    let monthly = {};
    let yearly = {};
    let weekly = {};
    if (id) {
      //ik average / total day isnt logic , dont rant its sjust for some testing
      //pull average/total by week (past week)

      await pullDaily(daily, id, "protein");
      //pull average/total by week (past )
      await pullWeekly(weekly, id, "protein");
      //pull average/total by month (past )
      await pullMonthly(monthly, id, "protein");
      //pull average/total by year
      await pullYearly(yearly, id, "protein");
      //pull all time average/total

      //all good
      return res.json({
        status: 201,
        ok: 1,
        data: {
          monthly: monthly,
          yearly: yearly,
          daily: daily,
          weekly: weekly,
        },
        message: "calories metrics pulled",
      });
    } else {
      return res.json({
        status: 400,
        ok: 0,
        message: "Input Missing / Error",
      });
    }
  } catch (e) {}
});

module.exports = router;
