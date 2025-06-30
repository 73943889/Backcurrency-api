// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const currencyRoutes = require('./src/routes/currencyRoutes');
const tokenRoutes = require('./src/routes/authRoutes');
const registerClientP = require('./src/routes/clientRoutes');
const registerUserGoogle = require('./src/routes/userGoogleRoutes');
const loginClient = require('./src/routes/loginclientRoutes');
const loginUserGoogle= require('./src/routes/loginUserGoogleRoutes');
const westernRoutes = require('./src/routes/westerUnionRate');
const cambioEuroRoutes = require('./src/routes/cambioEuroRate');
const convertRoutes = require('./src/routes/convert');
const transferRoutes = require('./src/routes/transferRoutes');
const changePassword= require('./src/routes/passwordchangesRoutes');
const forgotPassword = require('./src/routes/forgotPasswordRoutes');

const pingDbRoute = require('./src/routes/pingDbRoute');
const app = express();

console.log('🌐 ENV:', {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME
});

app.use(cors({
  origin: '*', // Solo para pruebas. En prod puedes poner: 'https://fluffy-salamander-44d47c.netlify.app'
}));
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/transfer', transferRoutes);
app.use('/api', currencyRoutes);
app.use('/api/auth', tokenRoutes);
app.use('/api', registerClientP); 
app.use('/api/register', registerUserGoogle); 
app.use('/api/personal-client', loginClient);
app.use('/api/google-login', loginUserGoogle);
app.use('/api', westernRoutes);
app.use('/api', cambioEuroRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/reset-password', changePassword);
app.use('/api/forgot-password', forgotPassword);
app.use('/api', pingDbRoute);
const PORT = process.env.PORT || 5037;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});