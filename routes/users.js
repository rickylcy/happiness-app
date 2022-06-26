var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const options = require("../knexfile.js");
const knex = require("knex")(options);
let loginEmail;

router.post("/register", function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed",
    });
  }

  const queryUsers = knex.from("users").select("*").where("email", "=", email);
  queryUsers
    .then((users) => {
      if (users.length > 0) {
        return res.status(409).json({
          error: true,
          message: "User already exists",
        });
      }
      const saltRounds = 10;
      const hash = bcrypt.hashSync(password, saltRounds);
      return knex.from("users").insert({ email, hash });
    })
    .then(() => {
      return res.status(201).json({
        message: "User created",
      });
    });
});

router.post("/login", function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed",
    });
  }
  const queryUsers = knex.from("users").select("*").where("email", "=", email);
  queryUsers
    .then((users) => {
      if (users.length === 0) {
        return res.status(401).json({
          error: true,
          message: "Incorrect email or password",
        });
      }
      //Compare password hashes
      const user = users[0];
      return bcrypt.compare(password, user.hash);
    })
    .then((match) => {
      if (!match) {
        return res.status(401).json({
          error: true,
          message: "Incorrect email or password",
        });
      }
      loginEmail = email;
      // Create and return JWT token
      const secretKey = "secret key";
      const expires_in = 60 * 60 * 24; //1 Day
      const exp = Date.now() + expires_in * 1000;
      const token = jwt.sign({ email, exp }, secretKey);

      return res.status(200).json({
        token: token,
        token_type: "Bearer",
        expires_in: expires_in,
      });
    });
});

const authorizeProfile = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;

  // Retrieve token
  if (authorization && authorization.split(" ").length === 2) {
    token = authorization.split(" ")[1];
  } else {
    /*
    return res.status(401).json(
      {
        "error": true,
        "message": "Authorization header ('Bearer token') not found"
      }
    );*/
  }

  try {
    const secretKey = "secret key";
    const decoded = jwt.verify(token, secretKey);

    if (decoded.exp < Date.now()) {
      return res.status(401).json({
        error: true,
        message: "Authorization header ('Bearer token') not found",
      });
    }
    next();
  } catch (e) {
    //unauthorized
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  }
};

router.get("/:email/profile", function (req, res, next) {
  const authorization = req.headers.authorization;
  let token = null;
  if (authorization && authorization.split(" ").length === 2) {
    token = authorization.split(" ")[1];
  }
  if (token) {
    const secretKey = "secret key";
    const decoded = jwt.verify(token, secretKey);
    if (decoded.exp < Date.now()) {
      return res
        .status(401)
        .json({ error: true, message: "JWT token has expired" });
    }
  }
  email = req.params.email;

  knex
    .from("users")
    .select("email", "firstName", "lastName", "dob", "address")
    .where("email", "=", email)
    .then((rows) => {
      if (email === loginEmail) {
        return res.status(200).json({
          email: rows[0].email,
          firstName: rows[0].firstName,
          lastName: rows[0].lastName,
          dob: rows[0].dob,
          address: rows[0].address,
        });
      } else {
        return res.status(200).json({
          email: rows[0].email,
          firstName: rows[0].firstName,
          lastName: rows[0].lastName,
        });
      }
    })
    .catch((err) => {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    });
});

router.put("/:email/profile", authorizeProfile, function (req, res, next) {
  email = req.params.email;
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.dob ||
    !req.body.address
  ) {
    return res.status(400).json({
      error: true,
      message:
        "Request body incomplete: firstName, lastName, dob and address are required.",
    });
  }
  /*
    if (!Number.isNaN(parseInt(req.body.firstName)) 
    || !Number.isNaN(parseInt(req.body.lastName)) 
    || !Number.isNaN(parseInt(req.body.dob)) 
    || !Number.isNaN(parseInt(req.body.address)))
    */
  if (
    typeof req.body.firstName !== "string" ||
    typeof req.body.lastName !== "string" ||
    typeof req.body.address !== "string"
  ) {
    return res.status(400).json({
      error: true,
      message:
        "Request body invalid, firstName, lastName and address must be strings only.",
    });
  }
  if (!/\d{4}-\d{2}-\d{2}/.test(req.body.dob)) {
    return res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
    });
  }

  try {
    var parts = req.body.dob.split("-");
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);
    // Check the ranges of month and year
    if (year > 2021) {
      return res.status(400).json({
        error: true,
        message: "Invalid input, dob must be a date in the past.",
      });
    }
    if (year < 1000 || month == 0 || month > 12) {
      return res.status(400).json({
        error: true,
        message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
      });
    }
    var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    // Adjust for leap years
    if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) {
      monthLength[1] = 29;
    }
    // Check the range of the day
    if (day > 0 && day <= monthLength[month - 1]) {
    } else {
      return res.status(400).json({
        error: true,
        message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
      });
    }
  } catch {
    return res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
    });
  }

  const filter = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dob: req.body.dob,
    address: req.body.address,
  };

  if (email === loginEmail) {
    knex("users")
      .where("email", "=", loginEmail)
      .update({
        firstName: filter.firstName,
        lastName: filter.lastName,
        dob: filter.dob,
        address: filter.address,
      })
      .then(function () {
        return res.status(200).json({
          email: email,
          firstName: filter.firstName,
          lastName: filter.lastName,
          dob: filter.dob,
          address: filter.address,
        });
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ Message: "Database error - not updated" });
      });
  } else {
    return res.status(403).json({
      error: true,
      message: "Forbidden",
    });
  }
});

module.exports = router;
