const tokenStore = new Map(); // token => expirationTime (en ms desde epoch)

const EXPIRATION_MINUTES = 720;

function authMiddleware(req, res, next) {
  const apiKey = req.header('x-api-key');
  if (!apiKey) {
    return res.status(401).json({ message: 'Falta el API Key' });
  }

  const expiration = tokenStore.get(apiKey);

  if (!expiration) {
    return res.status(403).json({ message: 'API Key inválido' });
  }

  const now = Date.now();
  if (now > expiration) {
    tokenStore.delete(apiKey); // Eliminar token expirado
    return res.status(403).json({ message: 'Token expirado, inicia sesión nuevamente' });
  }

  next();
}

// Para registrar un nuevo token con expiración
function addToken(token) {
  const expiresAt = Date.now() + EXPIRATION_MINUTES * 60 * 1000;
  tokenStore.set(token, expiresAt);
}

module.exports = {
  authMiddleware,
  addToken,
};