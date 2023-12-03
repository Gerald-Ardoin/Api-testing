// example script for hash generation
const bcrypt = require('bcrypt');
const saltRounds = 10;
const password = 'rftgyh';

bcrypt
  .hash(password, saltRounds)
  .then((hash) => {
    console.log('Hash: ', hash);
  })
  .catch((err) => console.error(err.message));
