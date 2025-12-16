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
const transferRoutes = require('./src/routes/transferRoutes');
const changePassword= require('./src/routes/passwordchangesRoutes');
const forgotPassword = require('./src/routes/forgotPasswordRoutes');
const lastMovement = require('./src/routes/LastTransfersRoutes');
const validateCuponRoute = require('./src/routes/validateCuponRoutes');
const cuponRoutes = require('./src/routes/cuponRoutes');
const exchangeRatesRoutes = require('./src/routes/exchangeRatesRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const verifyRoutes = require('./src/routes/verifyuserRoutes');
const app = express();

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
app.use('/api/reset-password', changePassword);
app.use('/api/forgot-password', forgotPassword);
app.use('/api/transfers', lastMovement);
app.use('/api/cupones', validateCuponRoute);
app.use('/api/cupon', cuponRoutes);
app.use('/api/exchange', exchangeRatesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', verifyRoutes);
//const PORT = process.env.PORT || 5037;
const PORT = 3000;

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Servidor ejecutándose en http://0.0.0.0:${PORT}`);
});