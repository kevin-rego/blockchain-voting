var express = require("express");
var router = express.Router();
/* GET users listing. */
// const express=require('express');
// const app=express()
var conn = require("../database");

router.get("/form", function (req, res, next) {
  // res.render('voter-registration.ejs');
  if (req.session.loggedinUser) {
    res.render("voter-registration.ejs");
  } else {
    res.redirect("/login");
  }
});

var getAge = require("get-age");

var nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  "", // ClientID
  "", // Client Secret
  "https://developers.google.com/oauthplayground" // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token: "",
});
const accessToken = oauth2Client.getAccessToken();

var rand = Math.floor(Math.random() * 10000 + 54);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "@gmail.com",
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    accessToken: accessToken,
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

var account_address;
var data;

router.post("/registerdata", function (req, res) {
  var dob = [];
  data = req.body.aadharno; //data stores aadhar no
  console.log(data);
  account_address = req.body.account_address; //stores metamask acc address
  //console.log(data);
  let sql = "SELECT * FROM aadhar_info WHERE Aadharno = ?";
  conn.query(sql, data, (error, results, fields) => {
    if (error) {
      return console.error(error.message);
    }
    //console.log(results)
    if (!results || results.length === 0) {
      res.render("voter-registration.ejs", {
        alertMsg: "Please enter valid data",
      });
    } else {
      dob = results[0].Dob;
      var email = results[0].Email;
      age = getAge(dob);
      is_registerd = results[0].Is_registered;
      if (is_registerd != "YES") {
        if (age >= 18) {
          var mailOptions = {
            from: "@gmail.com",
            to: email,
            subject: "Please confirm your Email account",
            text: "Hello, Your otp is " + rand,
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
          res.render("emailverify.ejs");
        } else {
          res.send("You cannot vote as your age is less than 18");
        }
      } //IF USER ALREADY REGISTERED
      else {
        res.render("voter-registration.ejs", {
          alertMsg: "You are already registered. You cannot register again",
        });
      }
    }
  });
});

router.post("/otpverify", (req, res) => {
  var otp = req.body.otp;
  if (otp == rand) {
    var record = { Account_address: account_address, Is_registered: "Yes" };
    var sql = "INSERT INTO registered_users SET ?";
    conn.query(sql, record, function (err2, res2) {
      if (err2) {
        throw err2;
      } else {
        var sql1 = "Update aadhar_info set Is_registered=? Where Aadharno=?";
        var record1 = ["YES", data];
        console.log(data);
        conn.query(sql1, record1, function (err1, res1) {
          if (err1) {
            res.render("voter-registration.ejs");
          } else {
            console.log("1 record updated");
            var msg = "You are successfully registered";
            // res.send('You are successfully registered');
            res.render("voter-registration.ejs", { alertMsg: msg });
          }
        });
      }
    });
  } else {
    res.render("voter-registration.ejs", {
      alertMsg: "Session Expired! , You have entered wronge OTP ",
    });
  }
});

module.exports = router;
