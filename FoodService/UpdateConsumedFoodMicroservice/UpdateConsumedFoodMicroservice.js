const express = require("express");
const router = express.Router();

const db = require("../../database/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { authenticate, numberChecker, checker } = require("../../utils.js");

router.post("/add", authenticate, async (req, res) => {
  const { id, servings } = req.body;
  if (id && servings) {
    const result = await db.query("SELECT * FROM foods WHERE id=$1", [id]);

    if (result.rowCount > 0) {
      //all good

      const foodObj = result.rows[0];
      console.log(foodObj);
      const next = await db.query(
        "INSERT INTO consumed_foods (id,protein,calories,carbs,portion,servings,name,userid) VALUES($8,$1,$2,$3,$4,$5,$6,$7);",
        [
          foodObj.protein,
          foodObj.calories,
          foodObj.carbs,
          foodObj.portion,
          servings,
          foodObj.name,
          foodObj.userid,
          foodObj.id,
        ]
      );
      if (!next.rowCount) {
        return res.json({
          status: 501,
          ok: 0,
          message: "Internal Error",
        });
      }
      return res.json({
        status: 201,
        ok: 1,
        message: "Consumed successfuly added",
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

// router.post("/instantAdd", authenticate, async (req, res) => {
//   const { id, servings, name, kcal, protein, carbs, portion } = req.body;

//   if (id && servings && name) {
//     const foodObj = {
//       kcal,
//       protein,
//       carbs,
//       portion,

//       name,
//       id,
//     };
//     const next = await db.query(
//       "INSERT INTO consumed_foods (id,protein,calories,carbs,portion,servings,name,userid) VALUES($8,$1,$2,$3,$4,$5,$6,$7);",
//       [
//         foodObj.protein,
//         foodObj.calories,
//         foodObj.carbs,
//         foodObj.portion,
//         servings,
//         foodObj.name,
//         req.user.id,
//         foodObj.id,
//       ]
//     );
//     if (!next.rowCount) {
//       return res.json({
//         status: 501,
//         ok: 0,
//         message: "Internal Error",
//       });
//     }
//     return res.json({
//       status: 201,
//       ok: 1,
//       message: "Consumed successfuly added",
//     });
//   } else {
//     return res.json({
//       status: 400,
//       ok: 0,
//       message: "Input Missing / Error",
//     });
//   }
// });

router.post("/reset", authenticate, async (req, res) => {
  try {
    const id = req.user.id;
    if (id) {
      const pastDate = new Date(JSON.parse(req.body.PastDate));
      const dateOnly = pastDate.toISOString().split("T")[0];
      const consumedfoodsResults = await db.query(
        "SELECT * FROM consumed_foods WHERE userid=$1",
        [id]
      );
      await db.query("BEGIN");
      //removal for security against multiple resets per day
      await db.query(
        "DELETE FROM past_consumed_foods WHERE consumed_date=$1 AND userid=$2",
        [dateOnly, id]
      );
      for (const row of consumedfoodsResults.rows) {
        console.log("row");
        console.log(row);

        await db.query(
          "INSERT INTO past_consumed_foods(name,protein,carbs,calories,portion,servings,userid,consumed_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
          [
            row.name,
            row.protein,
            row.carbs,
            row.calories,
            row.portion,
            row.servings,
            row.userid,
            dateOnly,
          ]
        );
      }
      const result = await db.query(
        "DELETE  FROM consumed_foods WHERE userid=$1",
        [id]
      );
      console.log(result);
      //all good
      await db.query("COMMIT");
      return res.json({
        status: 201,
        ok: 1,
        message: "Consumed foods Successfully reset",
      });
    } else {
      return res.json({
        status: 400,
        ok: 0,
        message: "Input Missing / Error",
      });
    }
  } catch (e) {
    await db.query("ROLLBACK");
    console.log(e.message + " " + e.stack);
  }
});

router.get("/read", authenticate, async (req, res) => {
  const id = req.user.id;
  if (id) {
    const result = await db.query(
      "SELECT * FROM consumed_foods WHERE userid=$1",
      [id]
    );

    if (result.rowCount > 0) {
      //all good
      return res.json({
        status: 201,
        ok: 1,
        data: result.rows,
        message: "Consumed foods pulled",
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
    console.log("date");
    console.log(date);
    if (id) {
      const result = await db.query(
        "SELECT * FROM past_consumed_foods WHERE userid=$1 AND consumed_date=$2",
        [id, date]
      );
      console.log(result.rows);

      if (result.rowCount >= 0) {
        //all good
        return res.json({
          status: 201,
          ok: 1,
          data: result.rows,
          message: "Past Consumed foods pulled",
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

module.exports = router;
