-- ========================================
-- ESQUEMA DE BASE DE DATOS - EUROFFERSURV
-- MySQL / MariaDB (CyberPanel / Hostinger)
-- ========================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- TABLA: users
-- ========================================
CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    user_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,

    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NULL,
    gender VARCHAR(20) NOT NULL DEFAULT 'not-specified',

    -- Campos financieros
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_earned DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_withdrawn DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    completed_offers INT NOT NULL DEFAULT 0,

    -- Estado / control (en MySQL usamos TINYINT(1))
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    newsletter TINYINT(1) NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ========================================
-- TABLA: transactions
-- ========================================
CREATE TABLE transactions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    user_id VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,

    type VARCHAR(50) NOT NULL DEFAULT 'reward',
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    source VARCHAR(100) NOT NULL DEFAULT 'theoremreach',
    description TEXT NULL,

    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ========================================
-- COMENTARIOS (MySQL usa COMMENT inline o ALTER)
-- ========================================
ALTER TABLE users COMMENT = 'Tabla principal de usuarios registrados en la plataforma';
ALTER TABLE transactions COMMENT = 'Historial completo de transacciones y recompensas';

ALTER TABLE users
  MODIFY user_id VARCHAR(50) NOT NULL COMMENT 'ID único del usuario para usar con TheoremReach',
  MODIFY balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Balance actual disponible para retiro',
  MODIFY total_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total acumulado ganado desde el registro';

ALTER TABLE transactions
  MODIFY transaction_id VARCHAR(255) NOT NULL COMMENT 'ID único TheoremReach para prevenir duplicados';
