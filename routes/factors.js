var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
const options = require("../knexfile.js");
const knex = require("knex")(options);

const authorize = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;

  // Retrieve token
  if (authorization && authorization.split(" ").length === 2) {
    if (authorization.split(" ")[0] != "Bearer") {
      return res.status(401).json({
        error: true,
        message: "Authorization header is malformed",
      });
    }
    token = authorization.split(" ")[1];
    console.log("Token:", token);
  } else {
    console.log("Unauthorized user");
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  }

  try {
    const secretKey = "secret key";
    const decoded = jwt.verify(token, secretKey);

    if (decoded.exp < Date.now()) {
      console.log("token is expired!");
      return res
        .status(401)
        .json({ error: true, message: "Token is expired!" });
    }
    next();
  } catch (e) {
    return res.status(401).json({
      error: true,
      message: "Invalid JWT token",
    });
    return;
  }
};

router.get("/:yearID", authorize, function (req, res, next) {
  const limit = req.query.limit;
  const country = req.query.country;
  const year = req.params.yearID;

  if (/[0-9]/.test(country) && country != null) {
    return res.status(400).json({
      error: true,
      message:
        "Invalid country format. Country query parameter cannot contain numbers.",
    });
  }
  if (!/^\d{4}$/.test(year) && year != null) {
    return res.status(400).json({
      error: true,
      message: "Invalid year format. Format must be yyyy",
    });
  }

  const q = req.query;
  if (Object.keys(q).length > 1) {
    return res.status(400).json({
      error: true,
      message:
        "Invalid query parameters. Only limit and country are permitted.",
    });
  }

  if (limit && !/^[1-9][0-9]*$/.test(limit)) {
    return res.status(400).json({
      error: true,
      message: "Invalid limit query. Limit must be a positive number.",
    });
  }

  if (limit) {
    knex("rankings")
      .select(
        `rank`,
        `country`,
        `score`,
        `economy`,
        `family`,
        `health`,
        `freedom`,
        `generosity`,
        `trust`,
        `year`
      )
      .limit(limit)
      .where("year", "=", year)
      .then((result) => {
        return res.status(200).json(result);
      });
  } else {
    knex("rankings")
      .select(
        `rank`,
        `country`,
        `score`,
        `economy`,
        `family`,
        `health`,
        `freedom`,
        `generosity`,
        `trust`,
        `year`
      )
      .where((builder) => {
        if (country) {
          builder.where("country", "=", country);
        }
        if (year) {
          builder.where("year", "=", year);
        }
      })
      .then((result) => {
        return res.status(200).json(result);
      });
  }
});

module.exports = router;
