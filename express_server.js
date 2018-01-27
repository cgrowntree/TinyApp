var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
var cookieParser = require('cookie-parser');
app.use(cookieParser());
const bcrypt = require('bcrypt');

var urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "user1"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    userID: "user2"
  }
};

const users = { 
  "user1": {
    id: "user1", 
    email: "user1@user.com", 
    password: "user1"
  },
  "user2": {
    id: "user2", 
    email: "user2@user.com", 
    password: "user2"
  }
};

function generateRandomString() {
  var output = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
  output += possible.charAt(Math.floor(Math.random() * possible.length));

  return output;
};

//Loop through each email in users and check if it is the same as givin email
function checkExistingEmail(email) {
  for (var userID in users) {
    if (users[userID].email === email) return true;
  }
  return false;
}

//Loop through userIDs to only show database which relates to specified user
function urlsForUser(id) {
  const longURL = urlDatabase[req.params.id];
  let urlDatabase = ''
  for (var userID in longURL) {
    if(longURL.userID === req.cookies.user_id);
  }
  return false;
}

app.use(function(req, res, next) {
  res.locals.user_id = req.cookies["user_id"] || false;
  next();
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render('login');
});

app.get("/urls", (req, res) => {
  let userId = req.cookies["user_id"];
  let templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {urlObj: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

// -----------------Post Requests ------------------------------------------

app.post("/register", (req, res) => {
  var userID = generateRandomString();
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  let userVars = {id: userID, email: req.body.email, password: hashedPassword};
  console.log(hashedPassword);
  //if email or password is blank set and render 400 status
  if (!userVars.email || !userVars.password) {
    res.status(400).render('400');
  //if email sent = email in db set and render 400 status
  } else if (checkExistingEmail(req.body.email)) {
    res.status(400).render('400'); // TODO: add res.cookie and set if cookie in register to display error
  } else {
    // insert userVars into database
    users[userID] = userVars;
    res.cookie('user_id', userID);
    res.redirect('/urls');
  }
});

// users[user].password === req.body.password)

app.post("/login", (req, res) => {
   let emailAndPwMatched = false;
   let userID = '';
   for (var user in users) {
     if ((users[user].email === req.body.email) && (bcrypt.compareSync(req.body.password, users[user].password))) {
      emailAndPwMatched = true;
      userID = users[user].id;
      }
    }
   if (!checkExistingEmail(req.body.email)) {
    res.status(403).render('400');
    console.log('email doesnt exist')
  } else if (emailAndPwMatched) {
    res.cookie('user_id', userID);
    res.redirect('/urls');
  } else {
    res.status(403).render('400');
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[id] = {
    shortURL: shortURL,
    longURL: longURL,
    userID: req.cookies.user_id
  };
  res.redirect('http://localhost:8080/urls/' + shortURL)
});

app.post("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id, longURL: req.body.longURL};
  //TODO: update else/if statment to work
  if (templateVars) {
    urlDatabase[templateVars.shortURL] = templateVars.longURL;
    res.redirect(`/urls/${req.params.id}`);
  } else {
    res.status(404).render('404');
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const UrlObj = urlDatabase[req.params.id];
  if(UrlObj.userID === req.cookies.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.status(403).send('You are not allowed! Go away.');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});