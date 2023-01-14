const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

app.set("view engine", "ejs");

////////////////
/* MIDDLEWARE */
////////////////

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["keykeykey"]
}));

/////////////
/* HELPERS */
/////////////

// generate 6-digit string of random lower case letters and numbers
const generateRandomString = () => {
  return Math.random().toString(16).slice(2, 8);
};

// return user_id given email
const getUserByEmail = (email) => {
  for (const userID in userDatabase) {
    if (userDatabase[userID].email === email) {
      return userDatabase[userID].id;
    }
  }
  return false;
};

// returns database of url objects that match given user id
const urlsForUser = (id, database) => {
  let userURLs = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = database[shortURL];
    }
  }

  return userURLs;
};

///////////////
/* DATABASES */
///////////////

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "sd3dss"
  },
  ssm5xK: {
    longURL: "http://www.google.com",
    userID: "sd3dss"
  }
};

const userDatabase = {
  d5dd49: {
    id: "d5dd49",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  dsjfe3: {
    id: "dsjfe3",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
  sd3dss: {
    id: "sd3dss",
    email: "test@test.com",
    password: "test"
  }
};

///////////////
/* GET PATHS */
///////////////

// GET /
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect('/login');
  }
});

// GET /urls.json
// display database in plaintext (for testing)
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
  // res.json(userDatabase);
});

// GET /urls
// shows URLs associated with logged in user
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const userURLs = urlsForUser(userID, urlDatabase);
  const templateVars = {
    urls: userURLs,
    user: userDatabase[req.session.user_id]
  };

  // error if not logged in
  if (!templateVars.user) {
    return res.status(401).send("Please log in or register to view this page.");
  }

  res.render("urls_index", templateVars);
});

// GET /urls/new
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session.user_id]
  };

  // redirect to /login if not logged in
  if (!templateVars.user) {
    res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

// GET /urls/:id
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: userDatabase[req.session.user_id]
  };

  // error if shortURL does not exist
  if (!urlDatabase[templateVars.id]) {
    return res.status(404).send("This URL doesn't exist!");
  }

  // can only view shortURL pages that belong to user
  if (urlDatabase[templateVars.id].userID !== templateVars.user) {
    return res.status(401).send("This URL belongs to another account.");
  }
  res.render("urls_show", templateVars);
});

// GET /u/:id
// redirects short URL (id) to long URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// GET /register
app.get("/register", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session.user_id]
  };

  // if user logged in, redirect to /urls
  if (templateVars.user) {
    res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

// GET /login
app.get("/login", (req, res) => {
  const templateVars = {
    user: userDatabase[req.session.user_id]
  };
  res.render("urls_login", templateVars);
});

////////////////
/* POST PATHS */
////////////////

// POST /urls - creates new shortURLs
app.post("/urls", (req, res) => {
  let user = userDatabase[req.session.user_id];

  // error if not logged in
  if (!user) {
    return res.status(401).send("Please log in to shorten new URLS!");
  }

  // create new shortURL with generated id, redirect to new shortURL page
  const newID = generateRandomString();
  urlDatabase[newID] = {
    longURL: req.body.longUR,
    userID: user
  };
  res.redirect(`/urls/${newID}`);
});

// POST /urls/:id/delete - deletes selected shortURL
app.post("/urls/:id/delete", (req, res) => {
  const del = req.params.id;
  let user = userDatabase[req.session.user_id];

  // error if id does not exist
  if (!urlDatabase[del]) {
    return res.status(400).send("Delete failed - URL id does not exist.");
  }
  // error if not logged in
  if (!user) {
    return res.status(401).send("User is not logged in.");
  }
  // error if user does not own URL
  if (urlDatabase[del].userID !== user) {
    return res.status(401).send("URL does not belong to current user.");
  }

  // removes url from database given id, redirects to /urls
  delete urlDatabase[del];
  res.redirect("/urls");
});

// POST /urls/:id
app.post("/urls/:id", (req, res) => {
  const newURL = req.body.longURL;
  const id = req.params.id;
  let user = userDatabase[req.session.user_id];

  // error if id does not exist
  if (!urlDatabase[id]) {
    return res.status(400).send("Delete failed - URL id does not exist.");
  }
  // error if not logged in
  if (!user) {
    return res.status(401).send("User is not logged in.");
  }
  // error if user does not own URL
  if (urlDatabase[id].userID !== user) {
    return res.status(401).send("URL does not belong to current user.");
  }

  // updates longURL of given id, redirects to /urls
  urlDatabase[id] = { longURL: newURL, userID: userDatabase[req.session.user_id] };
  res.redirect("/urls");
});

// POST /login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  let user;
  if (getUserByEmail(email)) {
    user = userDatabase[getUserByEmail(email)];
  }

  // error if incorrect credentials
  if (!user || !bcrypt.compareSync(password, user.hashedPass)) {
    return res.status(403).send("You have entered an invalid username or password.");
  }

  // give cookie on sucessful authentication, redirect to /urls
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

// POST /logout
// clears user_id cookie, redirect to /login
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});

// POST /register
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const hashedPass = bcrypt.hashSync(password, salt);

  // error if fields not filled
  if (!email || !password) {
    return res.status(400).send("Please fill in all fields!");
  }
  // error if email in use
  if (getUserByEmail(email)) {
    return res.status(400).send("Email already in use!");
  }

  // add new user with generated id to database, redirect to /urls
  const id = generateRandomString();
  userDatabase[id] = { id, email, hashedPass };
  console.log(userDatabase[id]);
  req.session.user_id = id;
  res.redirect("/urls");
});

//////////////////////
/* SERVER LISTENING */
//////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});