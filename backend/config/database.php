<?php
/**
 * Configuración de Base de Datos PostgreSQL
 * EurOffersurv.com
 */

// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'euroffersurv_db');
define('DB_USER', 'postgres'); // Cambiar según tu configuración
define('DB_PASS', 'root'); // Cambiar según tu configuración

/**
 * Clase para manejar la conexión a PostgreSQL
 */
class Database {
    private static $instance = null;
    private $conn;

    private function __construct() {
        try {
            $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
            
            $this->conn = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            error_log("Error de conexión a la base de datos: " . $e->getMessage());
            die("Error de conexión a la base de datos. Por favor, contacte al administrador.");
        }
    }

    /**
     * Obtiene la instancia única de la conexión (Singleton)
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Obtiene la conexión PDO
     */
    public function getConnection() {
        return $this->conn;
    }

    /**
     * Previene la clonación del objeto
     */
    private function __clone() {}

    /**
     * Previene la deserialización del objeto
     */
    public function __wakeup() {
        throw new Exception("No se puede deserializar un singleton.");
    }
}
