const express = require("express");
const session = require("express-session");
const flash = require("express-flash");
const bcrypt = require("bcryptjs");
const mysql = require("mysql");
const dotenv = require("dotenv");
const path = require("path");
const hbs = require("hbs");
const { redirect } = require("react-router-dom");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "hbs");
const partialsPath = path.join(__dirname, "./partials");
hbs.registerPartials(partialsPath);

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DATABASE,
});

db.connect((error) => {
  if (error) {
    console.error("Database connection error: ", error);
  } else {
    console.log("Connected to the database");
  }
});
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/welcome"));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

app.get("/", (req, res) => {
  res.render("index", { message: req.flash("message") });
});
app.get("/welcome", (req, res) => {
  res.render("welcome"); // Assuming "welcome" is the name of your HBS view file
});


app.get("/register", (req, res) => {
  res.render("register", { message: req.flash("message") });
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
      [username, email,hashedPassword],
      (error, _) => {
        if (error) {
          console.log("error");
          req.flash("message", "Registration failed. Please try again.");
          res.redirect("/register");
        } else {
          req.flash("message", "Registration successful. You can now log in.");
          console.log("okk");
        }
      }
    );
  } catch (error) {
    console.error(error);
    req.flash("message", "An error occurred. Please try again.");
    res.redirect("/register");
  }
});
app.get("/login", async (req, res) => {
  const { email, password } = req.query;
  try {
    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) {
          console.log(err);
        } else {
          if (results.length > 0) {
            const Emailvalue = results[0].email;
            const hashedPassword = results[0].password;

            console.log(email, Emailvalue);
            if (email == Emailvalue && hashedPassword==password) {
              

              console.log("Login successful");
              res.redirect("/welcome");
            } else {
              console.log("Invalid email");
              // alert("invalid mail and password");
              res.send("invalid msg")
            }
          } else {
            console.log("User not found");
            // Send an error response here or redirect to an error page
            res.redirect("/register");
            console.log(results);
          }
        }
      }
    );
  } catch (error) {
    console.log("Error:", error);
    // Handle other errors here, send an appropriate response, or redirect
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
