<?php
/**
 * Configuración de Base de Datos PostgreSQL (Render / Producción)
 * EurOffersurv.com
 */

class Database {
    private static $instance = null;
    private $conn;

    private function __construct() {
        try {
            // 1) Prioridad: DATABASE_URL (Render)
            $dbUrl = getenv('DATABASE_URL');

            if ($dbUrl) {
                $parts = parse_url($dbUrl);

                $host = $parts['host'] ?? '';
                $port = $parts['port'] ?? 5432;
                $user = $parts['user'] ?? '';
                $pass = $parts['pass'] ?? '';
                $db   = ltrim($parts['path'] ?? '', '/');

                // Render requiere SSL
                $dsn = "pgsql:host={$host};port={$port};dbname={$db};sslmode=require";

                $this->conn = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
                return;
            }

            // 2) Fallback: variables separadas
            $host = getenv('DB_HOST') ?: '127.0.0.1';
            $port = getenv('DB_PORT') ?: '5432';
            $name = getenv('DB_NAME') ?: '';
            $user = getenv('DB_USER') ?: '';
            $pass = getenv('DB_PASS') ?: '';

            if (!$name || !$user) {
                throw new Exception(
                    'Faltan variables de entorno de DB (DATABASE_URL o DB_HOST/DB_NAME/DB_USER/DB_PASS).'
                );
            }

            $dsn = "pgsql:host={$host};port={$port};dbname={$name};sslmode=require";

            $this->conn = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);

        } catch (Throwable $e) {
            // 🔴 DEBUG: mostrar error real
            error_log("DB_CONNECT_ERROR: " . $e->getMessage());
            http_response_code(500);
            echo "DB_CONNECT_ERROR: " . $e->getMessage();
            exit;
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->conn;
    }

    private function __clone() {}

    public function __wakeup() {
        throw new Exception("No se puede deserializar un singleton.");
    }
}
