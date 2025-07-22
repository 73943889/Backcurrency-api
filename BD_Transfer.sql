-- Verificar si la base de datos existe y eliminarla
DROP DATABASE IF EXISTS BDD_transfer;

-- Crear nuevamente la base de datos
CREATE DATABASE BDD_transfer;

-- Usar la base de datos
USE BDD_transfer;

DROP TABLE IF EXISTS personal_Client;
CREATE TABLE IF NOT EXISTS personal_Client (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name varchar(40) not null,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  dni VARCHAR(20),
  phone varchar(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

select * from personal_Client;

DROP TABLE IF EXISTS password_changes;
CREATE TABLE IF NOT EXISTS password_changes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(100),
  change_type ENUM('forgot','manual') DEFAULT 'manual',
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

select * from password_changes;

DROP TABLE IF EXISTS password_resets;
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  token VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

select * from password_resets;

DROP TABLE IF EXISTS google_users;
CREATE TABLE IF NOT EXISTS google_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    uid VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
SELECT * FROM google_users WHERE email = 'danielgastelusotelo@gmail.com';
select * from google_users;
-- delete from google_users where id=2;

DROP TABLE IF EXISTS company_Client;
CREATE TABLE IF NOT EXISTS company_Client (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  ruc VARCHAR(20),         -- Solo para empresa
  name VARCHAR(100),       -- Nombre completo o razón social
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
select * from company_Client;

DROP TABLE IF EXISTS cupones;
CREATE TABLE IF NOT EXISTS cupones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  descuento DECIMAL(5,4) NOT NULL DEFAULT 0.00,
  -- Expiración por tiempo
  expiracion DATETIME DEFAULT NULL,
  -- Expiración por uso
  usos_maximos INT DEFAULT NULL,
  usos_actuales INT DEFAULT 0,
  -- Tipo de expiración: 'tiempo', 'uso', o NULL si no expira
  tipo_expiracion ENUM('tiempo', 'uso') DEFAULT NULL,
  usado BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- insertion por tiempo
INSERT INTO cupones (user_id, codigo, descuento, expiracion, tipo_expiracion)
VALUES (1, 'ABC123XYZ', 00.0002, DATE_ADD(NOW(), INTERVAL 3 DAY), 'tiempo');

-- insertion por numero de transferencias
INSERT INTO cupones (user_id, codigo, descuento, usos_maximos, tipo_expiracion)
VALUES (3, 'XYZ987LMN', 15.00, 5, 'uso');

select * from cupones;
UPDATE cupones set usos_maximos=2 where id=2;

DROP TABLE IF EXISTS config_cupones;
CREATE TABLE IF NOT EXISTS config_cupones (
  id INT PRIMARY KEY,
  activa BOOLEAN DEFAULT TRUE, -- para activar/desactivar la promoción
  tipo_expiracion ENUM('tiempo', 'uso', 'ambos') NOT NULL,
  duracion_valor INT DEFAULT NULL, -- solo si tipo incluye 'tiempo'
  duracion_unidad ENUM('minuto', 'hora', 'dia', 'semana', 'mes') DEFAULT NULL,
  usos_maximos INT DEFAULT NULL, -- solo si tipo incluye 'uso'
  descuento DECIMAL(5,4) NOT NULL,
  descripcion TEXT,
  creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 🎯 Promoción por uso (5 transferencias)
INSERT INTO config_cupones (id, activa, tipo_expiracion, duracion_valor, duracion_unidad,usos_maximos, descuento, descripcion) 
VALUES (1, TRUE, 'uso', NULL, NULL, 5, 0.0002, 'Cupón válido para 5 transferencias');

Select * from config_cupones;

-- Verificar si la tabla existe y eliminarla
DROP TABLE IF EXISTS conversions;

-- Crear nuevamente la tabla
CREATE TABLE IF NOT EXISTS conversions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    converted_amount DECIMAL(18, 2) NOT NULL,
    rate DECIMAL(18, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE conversions 
MODIFY rate DECIMAL(10,4) DEFAULT 0.0000;

DROP TABLE IF EXISTS api_keys;
CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_value VARCHAR(512) NOT NULL UNIQUE,
  user_email VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  password VARCHAR(100), -- opcional para login social
  email VARCHAR(100) NOT NULL UNIQUE,
  type ENUM('personal', 'company', 'google') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

select * from users;
delete from users where id=5;

DROP TABLE IF EXISTS transferencias;
CREATE TABLE transferencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, 
  nombre VARCHAR(100),
  dni VARCHAR(15),
  cuenta VARCHAR(50),
  banco VARCHAR(50),
  email VARCHAR(100),
  monto DECIMAL(10, 2),
  cod_aprobacion VARCHAR(20),
  comprobante_url TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
ALTER TABLE transferencias ADD moneda VARCHAR(3) DEFAULT 'PEN';
delete from transferencias where email='danielgastelu.s@gmail.com';
select * from transferencias;
select * from api_keys;
select * from users;
select * from transfers;
SELECT * FROM password_resets ORDER BY created_at DESC LIMIT 1;
SELECT id, name, email FROM personal_Client;
ALTER TABLE transferencias ADD COLUMN cupon VARCHAR(10) NULL;
