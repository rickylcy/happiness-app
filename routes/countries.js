var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
const options = require("../knexfile.js");
const knex = require("knex")(options);

router.get("/", function (req, res, next) {
  knex
    .from("rankings")
    .orderBy("country")
    .select("country")
    .distinct()
    .then((rows) => {
      const result = rows.map((item) => item.country);
      res.json(result);
    })
    .catch((err) => {
      return res
        .status(400)
        .json({
          error: "true",
          message:
            "Invalid query parameters. Query parameters are not permitted.",
        });
    });
});

module.exports = router;
