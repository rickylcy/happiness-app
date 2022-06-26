var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
const options = require("../knexfile.js");
const knex = require("knex")(options);

router.get("/", function (req, res, next) {
  year = req.query.year;
  country = req.query.country;

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
  if (Object.keys(q).length > 2) {
    res.status(400).json({
      error: true,
      message: "Invalid query parameters. Only year and country are permitted.",
    });
  }

  knex("rankings")
    .select("rank", "country", "score", "year")
    .orderBy("year", "desc")
    .orderBy("rank")
    .where((builder) => {
      if (year) {
        if (country) {
          builder.where("year", "=", year);
          builder.where("country", "=", country);
        } else {
          builder.where("year", "=", year);
        }
      } else {
        if (country) {
          builder.where("country", "=", country);
        } else {
        }
      }
    })
    .then((result) => {
      return res.status(200).json(result);
    })
    .catch((error) => console.log(error));

  /*
    if(year) {
      if(country) {
        knex
     .from("rankings")
     .select("rank", "country", "score", "year")
     .where("year", "=", year).andWhere("country","=",country)
     .then(rows => {
      if(!Number.isNaN(parseInt(country))) {
        return res.status(400).json({
         
          "error": true,
          "message": "Invalid country format. Country query parameter cannot contain numbers."
        });   
      }
      else {
        return res.status(200).json(rows);
        
      }
     })
     .catch(err => {
       return res.json({ Error: true, Message: "Error executing MySQL query" });
     });
    
    }else{
      knex
      .from("rankings")
      .select("rank", "country", "score", "year")
      .where("year", "=", year)
      .then(rows => {
        return res.status(200).json(rows);
      
      })
      .catch(err => {
        return res.json({ Error: true, Message: "Error executing MySQL query" });
      });
    }
      
    } else {
      if(country)
      {
        knex
      .from("rankings")
      .select("rank", "country", "score", "year")
      .where("country", "=", country)
      .orderBy("rank","desc")
      .then(rows => {
        if(Object.keys(rows).length === 0) {
          if(Number.isNaN(parseInt(country))) {
            return res.status(400).json({
              "error": true,
              "message": "Invalid country format. Country query parameter cannot contain numbers."
            });
           
          }
          else {
            return res.status(200).json([]);
            
          }
          
        }
        return res.status(200).json(rows);
      })
      .catch(err => {
        return res.status(400).json({
          "error": true,
          "message": "Invalid country format. Country query parameter cannot contain numbers."
        });
       
      });
      }
      else{
        knex
      .from("rankings")
      .select("rank", "country", "score", "year")
      .orderBy("year", "desc")
      .orderBy("rank")
      .then(rows => {
        return res.status(200).json(rows);
      })
      .catch(err => {
        return res.status(400).json({
          "error": true,
          "message": "Invalid country format. Country query parameter cannot contain numbers."
        });
      });
      }
      
  
    }*/
});

module.exports = router;
