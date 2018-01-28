var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieSession = require('cookie-session')
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

//MIDDLEWEAR===============================================

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


//DATABASE==================================================

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


// FUNCTIONS==============================================================

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


//GET REQUESTS=======================================================

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
    res.status(400).send('Please login or register to view your urls.');
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
    res.status(400).send('You may only edit your own urls. Check that the id is correct and try again.');
  }
});

app.get("/u/:id", (req, res) => {
    if (!urlDatabase[req.params.id]) {
      res.status(400).send('The shortened url entered is incorrect.');
    } else {
      res.redirect(urlDatabase[req.params.id].longURL);
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


//POST REQUESTS==============================================================

app.post("/register", (req, res) => {
  var userID = generateRandomString();
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  let userVars = {id: userID, email: req.body.email, password: hashedPassword};
  //if email or password is blank set and render 400 status
  if (!userVars.email || !userVars.password) {
    res.status(400).send('Please enter both an email and password to register.');
  //if email sent = email in db set and render 400 status
  } else if (checkExistingEmail(req.body.email)) {
    res.status(400).send('A user with this email already exists.');
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
  } else {
    //user id and password didnt match
    res.status(403).send('Password or email address incorrect. Please try again');
  }
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
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
    };
    res.redirect('/urls/' + shortURL)
  } else {
    res.status(400).send('Please login to access your urls.');
  }
});

app.post("/urls/:id", (req, res) => {
  let userId = req.session.user_id;
  if(userId){
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.status(400).send('Please login to edit your urls.');
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const UrlObj = urlDatabase[req.params.id];
  if(UrlObj.userID === req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.status(403).send('You may only delete your own urls.');
  }
});


//=================================================================
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});