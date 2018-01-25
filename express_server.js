var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
var cookieParser = require('cookie-parser');
app.use(cookieParser());

function generateRandomString() {
  var output = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
  output += possible.charAt(Math.floor(Math.random() * possible.length));

  return output;
};

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "user1": {
    id: "user1", 
    email: "user1@euser.com", 
    password: "user1"
  },
  "user2": {
    id: "user2", 
    email: "user2@user.com", 
    password: "user2"
  }
}

app.use(function(req, res, next) {
  res.locals.username = req.cookies["username"] || false;
  next();
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  userID = generateRandomString();
  let users = {id: userID, email: req.body.email, password: req.body.password};
  res.cookie('user_id', userID);
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id, longURL: req.body.longURL};
  if (templateVars) {
    urlDatabase[templateVars.shortURL] = templateVars.longURL;
    res.redirect(`/urls/${req.params.id}`);
  } else {
    res.status(404).render('404');
  }
});

app.post("/urls", (req, res) => {
  shortURL = generateRandomString();
  longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('http://localhost:8080/urls/' + shortURL)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});