var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
var cookieSession = require('cookie-session')

app.use(cookieSession({
  name: 'session',
  keys: ['secretKey'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.use(function(req, res, next) {
  res.locals.user_id = req.session.user_id || false;
  next();
});


//DATA FOR THE APP
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
    // password: "user1"
    password: "$2a$10$Rb8Unenn5y7JCUPUQen8/.hwf1xmVKkrGhd0PP9KvyWVi8C9z5TJy"
  },
  "user2": {
    id: "user2", 
    email: "user2@user.com", 
    password: "user2"
  }
};


// User defined functions ////
// =============================
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

//Loop through urlDatabase to check if given userID and shortURL match
function checkUserOwnsUrl(userID, shortURL) {
  for (var id in urlDatabase) {
    if ((urlDatabase[id].userID === userID) && (urlDatabase[id].shortURL === shortURL)) return true;
  }
  return false;
}

//Loop through userIDs to only show database which relates to specified user
function urlsForUser(id) {
  const longURL = urlDatabase[req.params.id];
  let urlDatabase = ''
  for (var userID in longURL) {
    if(longURL.userID === req.session.user_id);
  }
  return false;
}

// function to authenticate the user
function authenticateUser(email, password){
  var flag = false;
  var userId;
  for(var key in users){

    if((users[key].email===email) && (bcrypt.compareSync(password, users[key].password))){
      flag = true;
      userId = key;
      break;
    }
  }
  return userId;
}

///=============== functions ends here

app.get("/register", (req, res) => {
  let userId = req.session.user_id;
  if(userId){
    res.redirect('/urls');
  } else {
    res.render("register");
  }
});

app.get("/login", (req, res) => {
  let userId = req.session.user_id;
  if(userId){
    res.redirect('/urls');
  } else {
    res.render('login');
  }
});

app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  if(userId) {
    let templateVars = {urls: urlDatabase, user: user};
    res.render("urls_index", templateVars);
  } else {
    res.status(400).render('400');
  }
});

app.get("/urls/new", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  let templateVars = {urls: urlDatabase, user: user};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let userId = req.session.user_id;
  let user = users[userId];
  if(checkUserOwnsUrl(userId, shortURL)) {
    let templateVars = {urlObj: urlDatabase[req.params.id], user: user};
    res.render("urls_show", templateVars);
  } else if(urlDatabase[req.params.id]) {
    res.redirect('/urls');
  } else {
    res.status(400).render('400');
  }
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    let longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  } else {
    res.status(400).render('400');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/", (req, res) => {
  let userId = req.session.user_id;
  if(userId){
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
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
    req.session.user_id = userID;
    // res.cookie('user_id', userID);
    res.redirect('/urls');
  }
});

app.post("/login", (req, res) => {
  var email = req.body.email;
  var password = req.body.password;
  var result = authenticateUser(email, password);
  if(result){  
    //user is and password matched
    req.session.user_id = result;
    res.redirect('/urls');
    console.log("user id and password matched");
  } else {
    //user id and password didnt match
    res.status(403).render('400');
    console.log("user id and password did not match");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  // res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  let userId = req.session.user_id;
  let user = users[userId];
  if (userId) {
    urlDatabase[shortURL] = {
      shortURL: shortURL,
      longURL: longURL,
      userID: userId
      // userID: req.cookies.user_id
    };
    res.redirect('http://localhost:8080/urls/' + shortURL)
  } else {
    res.status(400).render('400');
  }
});

app.post("/urls/:id", (req, res) => {
  console.log("we are in the edit part");
  let userId = req.session.user_id;
  if(userId){
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.send("you need to login first and then edit it");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const UrlObj = urlDatabase[req.params.id];
  if(UrlObj.userID === req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.status(403).send('You are not allowed! Go away.');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});