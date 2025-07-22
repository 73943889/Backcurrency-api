// utils/generarCupon.js
function generarCuponAleatorio(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let cupon = '';
  for (let i = 0; i < length; i++) {
    cupon += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return cupon;
}

module.exports = generarCuponAleatorio;