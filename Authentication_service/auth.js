const express = require("express");
const router = express.Router();
const db = require("../database/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { checker, authenticate } = require("../utils");
const { Resend } = require("resend");
const util = require("util");

const { google } = require("googleapis");
const readline = require("readline");
const rateLimit = require("express-rate-limit");
const MailComposer = require("nodemailer/lib/mail-composer");
const AuthLimiter = rateLimit({
  windowMs: 30000, //each 5 mins,
  max: 10,
  message: "Too many Requests, please try again later",
});
const resend = new Resend(process.env.RESEND_API_KEY);

const passwordRegex = /^[a-zA-Z0-9]{8,20}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const usernameRegex = /^[a-zA-Z0-9]{1,20}$/;
const sleep = util.promisify(setTimeout);

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendVerificationEmail(email, code) {
  try {
    // get authorized Gmail API client
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // build raw email message
    const mail = new MailComposer({
      from: "anasrabhi246@gmail.com",
      to: email,
      subject: "Swipeat Verification Bot",
      text: `Hello!\nYour verification code is: ${code}`,
    });

    const message = await mail.compile().build();

    // encode to base64url for Gmail API
    const encodedMessage = message
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // send using Gmail API
    console.log("seind ..........");
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log("✅ Email sent successfully:", res.data.id);
  } catch (err) {
    console.error("❌ Gmail API error:", err);
  }
}
sendVerificationEmail("anasrabhi0@gmail.com", 5454);
// console.log("Open this URL in your browser:", authUrl);

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });
// rl.question("Enter the code from that page here: ", async (code) => {
//   const { tokens } = await oAuth2Client.getToken(code);
//   console.log("Refresh Token:", tokens.refresh_token);
//   rl.close();
// });

// to wait between retries
//aside for now (render smtp ports are sealed)
// async function sendVerificationEmail(
//   email,
//   code,
//   maxRetries = Infinity,
//   delayMs = 2000
// ) {
//   const transporter = nodemailer.createTransport({
//     service:"gmail"
//     auth: {
//       user: "anasrabhi246@gmail.com",
//       pass: process.env.NODE_MAILER_KEY,
//     },
//   });

//   const mailOptions = {
//     from: "no-reply@swipeat.com",
//     to: email,
//     subject: "Swipeat Account Verification",
//     text: `Hello! This is Swipeat Verification Bot.\nVERIFICATION CODE = ${code}`,
//   };

//   let attempt = 0;
//   console.log("process.env.NODE_MAILER_KEY");
//   console.log(process.env.NODE_MAILER_KEY);
//   while (attempt < maxRetries) {
//     try {
//       const info = await new Promise((resolve, reject) => {
//         transporter.sendMail(mailOptions, (error, info) => {
//           if (error) return reject(error);
//           resolve(info);
//         });
//       });

//       console.log("Email sent successfully:", info.response);
//       return code; // return the verification code once email is sent
//     } catch (err) {
//       attempt++;
//       console.log(`Attempt ${attempt} failed:`, err);
//       console.log(`Retrying in ${delayMs / 1000} seconds...`);
//       await sleep(delayMs);
//     }
//   }

//   console.log("Could not send email after multiple retries.");
//   return null;
// }

// Set the refresh token
async function sendRecoveryEmail(
  email,
  code,
  maxRetries = Infinity,
  delayMs = 2000
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "anasrabhi246@gmail.com",
      pass: process.env.NODE_MAILER_KEY,
    },
  });

  const mailOptions = {
    from: "no-reply@swipeat.com",
    to: email,
    subject: "Swipeat Account Recovery",
    text: `Hello! This is Swipeat Recovery Bot.\n RECOVERY CODE = ${code}`,
  };

  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const info = await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) return reject(error);
          resolve(info);
        });
      });

      console.log("Email sent successfully:", info.response);
      return code; // return the verification code once email is sent
    } catch (err) {
      attempt++;
      console.log(`Attempt ${attempt} failed:`, err);
      console.log(`Retrying in ${delayMs / 1000} seconds...`);
      await sleep(delayMs);
    }
  }

  console.log("Could not send email after multiple retries.");
  return null;
}

router.post("/resend", AuthLimiter, async (req, res) => {
  try {
    const { email } = {
      ...req.body,
    };

    if (!checker([email]))
      return res.json({ ok: 0, message: "Input Error", status: "404" });
    const emailResult = await db.query("SELECT * FROM users WHERE email=$1;", [
      email,
    ]);

    const emailRows = emailResult.rows;

    if (!emailRows || emailRows.length == 0) {
      return res.json({
        ok: 0,
        message: "User not existing",
        status: "400",
      });
    }
    const user = emailRows[0];
    last_verify_date = new Date(user.code_date).getTime();
    rightNow = new Date().getTime();
    timeDiffInMinutes = (rightNow - last_verify_date) / 1000000;

    if (timeDiffInMinutes < 5) {
      //already sent earlier
      return res.json({
        status: 200,
        ok: 0,
        message: "An email was sent recently for recovery , try again later",
      });
    } else {
      //send again
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await sendVerificationEmail(email, code);
      await db.query(`UPDATE users SET code_date=$1,code=$3 WHERE email=$2`, [
        new Date().toISOString(),
        email,
        code,
      ]);
      return res.json({
        status: 200,
        ok: 1,
        message: "An Recovery email is just sent , check your",
      });
    }
  } catch (e) {}
});
router.post("/verify", AuthLimiter, async (req, res) => {
  try {
    // await db.query(`DELETE FROM users ;`);
    const { code, email } = {
      ...req.body,
    };

    console.log("check");
    if (!checker([code, email]))
      return res.json({ ok: 0, message: "Input Error", status: "404" });

    //db check
    const emailResult = await db.query("SELECT * FROM users WHERE email=$1;", [
      email,
    ]);

    const emailRows = emailResult.rows;
    const user = emailRows[0];

    if (!emailRows || emailRows.length == 0) {
      return res.json({
        ok: 0,
        message: "User not existing",
        status: "400",
      });
    }

    if (user.verified) {
      return res.json({
        ok: 1,
        message: "already verified",
        status: "200",
      });
    }
    if (code != user.code) {
      return res.json({
        ok: 0,
        message: "Wrong Code",
        status: "200",
      });
    }

    //good to go either verify

    const insertionResult = await db.query(
      `UPDATE users SET code='',verified=TRUE WHERE email=$1;`,
      [email]
    );
    console.log(req.body);
    if (insertionResult.rowCount > 0) {
      console.log("done");

      return res.json({
        ok: 1,
        message: "Account Verified  Successfully , please proceeded to login",
        status: "200",
      });
    } else {
      return res.json({
        ok: 0,
        message: "Internal Error",
        status: "500",
      });
    }
  } catch (e) {
    console.log(e.message + " -> " + e.stack);

    return res.json({
      ok: 0,
      message: "Internal Error",
      status: "500",
    });
  }
});

router.post("/forgot", AuthLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!checker([email]))
      return res.json({
        status: 400,
        ok: 0,
        message: "Input Error",
      });

    const result = await db.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    const rows = result.rows;
    if (!rows.length)
      return res.json({
        status: 300,
        ok: 0,
        message: "Email Not Registered , Please Proceed to Register",
      });
    const user = rows[0];

    last_forgot_date = new Date(user.forgot_date).getTime();
    rightNow = new Date().getTime();
    timeDiffInMinutes = (rightNow - last_forgot_date) / 1000000;

    if (timeDiffInMinutes < 5) {
      //already sent earlier
      return res.json({
        status: 200,
        ok: 0,
        message: "An email was sent recently for recovery , try again later",
      });
    } else {
      //send again

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await sendVerificationEmail(email, code);
      await db.query(`UPDATE users SET code_date=$1,code=$3 WHERE email=$2`, [
        new Date().toISOString(),
        email,
        code,
      ]);
      return res.json({
        status: 200,
        ok: 1,
        message: "An Recovery email is just sent , check your",
      });
    }
  } catch (e) {
    console.log(e.message + " -> " + e.stack);

    return res.json({
      ok: 0,
      message: "Internal Error",
      status: "500",
    });
  }
});

router.post("/sign-up", AuthLimiter, async (req, res) => {
  try {
    // await db.query(`DELETE FROM users ;`);
    const { email, username, password, confirmPassword } = {
      ...req.body,
    };

    console.log("check");
    if (!checker([email, username, password, confirmPassword]))
      return res.json({ ok: 0, message: "Input Error", status: "404" });

    if (!usernameRegex.test(username))
      return res.json({
        ok: 0,
        message: "Username is Alphanumeric between 1 and 20 characters",
        status: "400",
      });

    if (!emailRegex.test(email))
      return res.json({
        ok: 0,
        message: "Email Format Is wrong",
        status: "400",
      });

    if (!passwordRegex.test(password))
      return res.json({
        ok: 0,
        message:
          "Password Alphanumeric contains symbols between 8 and 20 characters",
        status: "400",
      });

    if (password != confirmPassword)
      return res.json({
        ok: 0,
        message: "Passwords Dont Match",
        status: "400",
      });

    //db check
    const emailResult = await db.query("SELECT * FROM users WHERE email=$1;", [
      email,
    ]);
    const usernameResult = await db.query(
      "SELECT * FROM users WHERE username=$1;",
      [username]
    );
    const emailRows = emailResult.rows;
    const usernameRows = usernameResult.rows;
    if (usernameRows.length > 0) {
      return res.json({
        ok: 0,
        message: "Username Already Taken",
        status: "400",
      });
    }

    if (emailRows.length > 0) {
      return res.json({
        ok: 0,
        message: "Email Already Exists",
        status: "400",
      });
    }

    //good to go either verify

    const hashedPassword = await bcrypt.hash(password, 10);
    const initialreset = new Date();
    const insertionResult = await db.query(
      `INSERT INTO users (username,email,password,last_reset) VALUES ($1,$2,$3,$4)`,
      [username, email, hashedPassword, initialreset.toISOString()]
    );
    console.log(req.body);
    if (insertionResult.rowCount > 0) {
      console.log("done");

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await sendVerificationEmail(email, code);
      await db.query(`UPDATE users SET code_date=$1,code=$3 WHERE email=$2`, [
        new Date().toISOString(),
        email,
        code,
      ]);
      return res.json({
        ok: 1,
        message:
          "Registered Successfully , you need to verify your account First",
        status: "200",
      });
    } else {
      return res.json({
        ok: 0,
        message: "Internal Error",
        status: "500",
      });
    }
  } catch (e) {
    console.log(e.message + " -> " + e.stack);

    return res.json({
      ok: 0,
      message: "Internal Error",
      status: "500",
    });
  }
});

router.post("/validate", authenticate, AuthLimiter, async (req, res) => {
  return res.json({
    status: 200,
    ok: 1,
    message: "Valid Token",
  });
});

router.post("/sign-in", AuthLimiter, async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!checker([email, password]))
    return res.json({
      status: 400,
      ok: 0,
      message: "Input Error",
    });

  const result = await db.query("SELECT * FROM users WHERE email=$1", [email]);
  const rows = result.rows;
  if (!rows.length)
    return res.json({
      status: 300,
      ok: 0,
      message: "Email Not Registered , Please Proceed to Register",
    });
  const user = rows[0];

  const check = await bcrypt.compare(password, user.password);

  if (!check)
    return res.json({
      status: 400,
      ok: 0,
      message: "Wrong Password",
    });

  last_verification_date = new Date(user.code_date).getTime();
  rightNow = new Date().getTime();
  timeDiffInMinutes = (rightNow - last_verification_date) / 1000000;
  console.log("user**************************************");
  console.log(user);
  if (!user.verified) {
    if (timeDiffInMinutes < 5) {
      return res.json({
        status: 200,
        ok: 2,
        message:
          "You are unverified ,An email was sent recently , try again later",
      });
    } else {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await sendVerificationEmail(email, code);
      await db.query(`UPDATE users SET code_date=$1,code=$3 WHERE email=$2`, [
        new Date().toISOString(),
        email,
        code,
      ]);
      return res.json({
        status: 200,
        ok: 2,
        message: "You are unverified ,A code is just sent ,check your email",
      });
    }
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    status: 200,
    ok: 1,
    data: {
      token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        height: user.height,
        age: user.age,
        weight: user.weight,
        gender: user.gender,
        stepper: user.stepper,
        userLastReset: JSON.stringify(new Date(user.last_reset)),
      },
    },
    message: "Logged In Successfully",
  });
});

module.exports = router;
