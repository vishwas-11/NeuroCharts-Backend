// utils/bcrypt.js
// Utility functions for hashing and comparing passwords using bcryptjs.

const bcrypt = require('bcryptjs');

// Hash a plain text password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds
  return await bcrypt.hash(password, salt); // Hash the password with the generated salt
}

// Compare a plain text password with a hashed password
async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword); // Returns true if passwords match, false otherwise
}

module.exports = {
  hashPassword,
  comparePassword,
};

/*
  Explanation for utils/bcrypt.js:
  - `bcrypt.genSalt(10)`: Generates a salt. The `10` refers to the number of rounds (cost factor). A higher number means more secure but slower hashing. 10 is a good balance.
  - `bcrypt.hash(password, salt)`: Hashes the password using the generated salt.
  - `bcrypt.compare(plainPassword, hashedPassword)`: Compares a plain text password with a previously hashed password. This function handles the re-hashing internally and returns a boolean.
*/
