const crypto = require('crypto');

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex'); // 64 caracteres
}

module.exports = generateApiKey;