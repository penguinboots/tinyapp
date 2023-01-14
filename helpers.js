/////////////
/* HELPERS */
/////////////

// generate 6-digit string of random lower case letters and numbers
const generateRandomString = () => {
  return Math.random().toString(16).slice(2, 8);
};

// return user_id given email
const getUserByEmail = (email, database) => {
  for (const userID in database) {
    if (database[userID].email === email) {
      return database[userID].id;
    }
  }
  return undefined;
};

// returns database of url objects that match given user id
const urlsForUser = (id, database) => {
  let userURLs = {};

  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      userURLs[shortURL] = database[shortURL];
    }
  }

  return userURLs;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
};