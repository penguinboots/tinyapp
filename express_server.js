const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");

////////////////
/* MIDDLEWARE */
////////////////

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

///////////////
/* DATABASES */
///////////////

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  let user = userDatabase[req.cookies["user_id"]];
  if (user) {
    res.redirect("/urls");
  }
  res.send("Home page placeholder");
});

// GET /urls.json
// Display database in plaintext (for testing)
app.get("/urls.json", (req, res) => {
  // res.json(urlDatabase);
  res.json(userDatabase);
});

// GET /urls
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: userDatabase[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

// GET /urls/new
// redirect to /login if not logged in
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["user_id"]]
  };

  if (!templateVars.user) {
    res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

// GET /urls/:id
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: userDatabase[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

// GET /u/:id
// redirects short URL (id) to long URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// GET /register
// if user is logged in, redirect to /urls
app.get("/register", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["user_id"]]
  };
  if (templateVars.user) {
    res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

// GET /login
app.get("/login", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["user_id"]]
  };
  res.render("urls_login", templateVars);
});

////////////////
/* POST PATHS */
////////////////

// POST /urls
// creates new short URL with new generated id
// redirects to urls page for new URL
app.post("/urls", (req, res) => {
  let user = userDatabase[req.cookies["user_id"]];
  if (!user) {
    return res.send("Please log in to shorten new URLS!");
  }
  
  const newID = generateRandomString();
  urlDatabase[newID] = req.body.longURL;
  res.redirect(`/urls/${newID}`);
});

// POST /urls/:id/delete
// removes url from database given id
// redirects to /urls
app.post("/urls/:id/delete", (req, res) => {
  const del = req.params.id;
  delete urlDatabase[del];
  res.redirect("/urls");
});

// POST /urls/:id
// updates longURL of given id
// redirects to /urls
app.post("/urls/:id", (req, res) => {
  const newURL = req.body.longURL;
  const id = req.params.id;
  urlDatabase[id] = newURL;
  res.redirect("/urls");
});

// POST /login
// if username and password match database, give user_id cookie
// redirect to /urls
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  let user;

  if (getUserByEmail(email)) {
    user = userDatabase[getUserByEmail(email)];
  }

  if (!user || user.password !== password) {
    return res.status(403).send("You have entered an invalid username or password.");
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

// POST /logout
// clears used_id cookie
// redirect to /login
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/login");
});

// POST /register
// add new user (id, email, password) to database
// redirect to /urls
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Please fill in all fields!");
  }
  if (getUserByEmail(email)) {
    return res.status(400).send("Email already in use!");
  }

  const id = generateRandomString();
  userDatabase[id] = { id, email, password };
  console.log(userDatabase[id]);
  res.cookie("user_id", id);
  res.redirect("/urls");
});

//////////////////////
/* SERVER LISTENING */
//////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});