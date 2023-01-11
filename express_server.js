const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  // res.json(urlDatabase);
  res.json(userDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: userDatabase[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: userDatabase[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["user_id"]]
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: userDatabase[req.cookies["user_id"]]
  };
  res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  const newID = generateRandomString();
  urlDatabase[newID] = req.body.longURL;
  res.redirect(`/urls/${newID}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const del = req.params.id;
  delete urlDatabase[del];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const newURL = req.body.longURL;
  const id = req.params.id;
  urlDatabase[id] = newURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const user = req.body.username;
  res.cookie('username', user);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  const user = req.body.username;
  res.clearCookie('username', user);
  res.redirect("/urls");
});

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


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});