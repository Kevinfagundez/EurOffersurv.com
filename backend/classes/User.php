<?php
/**
 * Clase User - Manejo de usuarios
 * EurOffersurv.com
 */

require_once __DIR__ . '/../config/database.php';

class User {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Registra un nuevo usuario
     */
    public function register($data) {
        try {
            if ($this->emailExists($data['email'])) {
                return [
                    'success' => false,
                    'message' => 'Este correo electrónico ya está registrado'
                ];
            }

            $userId = $this->generateUserId();
            $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);

            // ✅ IMPORTANTE: Quitamos columnas que no existen en tu tabla Postgres (register_ip, user_agent)
            $query = "INSERT INTO users (
                user_id,
                first_name,
                last_name,
                email,
                password_hash,
                birth_date,
                newsletter,
                is_active,
                is_verified
            ) VALUES (
                :user_id,
                :first_name,
                :last_name,
                :email,
                :password_hash,
                :birth_date,
                :newsletter,
                TRUE,
                FALSE
            )
            RETURNING user_id, email";

            $stmt = $this->conn->prepare($query);

            $stmt->bindValue(':user_id', $userId);
            $stmt->bindValue(':first_name', $data['firstName']);
            $stmt->bindValue(':last_name', $data['lastName']);
            $stmt->bindValue(':email', $data['email']);
            $stmt->bindValue(':password_hash', $passwordHash);
            $stmt->bindValue(':birth_date', $data['birthDate']); // formato YYYY-MM-DD
            $stmt->bindValue(':newsletter', (bool)($data['newsletter'] ?? false), PDO::PARAM_BOOL);

            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'message' => 'Registro exitoso',
                'user_id' => $result['user_id'],
                'email' => $result['email']
            ];

        } catch (PDOException $e) {
            error_log("Error en registro: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al registrar usuario. Por favor, intente nuevamente.',
                'debug' => $e->getMessage()
            ];
        }
    }

    /**
     * Inicia sesión
     */
    public function login($email, $password) {
        try {
            $query = "SELECT * FROM users WHERE email = :email AND is_active = TRUE";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !password_verify($password, $user['password_hash'])) {
                return [
                    'success' => false,
                    'message' => 'Correo electrónico o contraseña incorrectos'
                ];
            }

            unset($user['password_hash']);

            // Consistencia con app.js
            $user['firstName'] = $user['first_name'];
            $user['lastName'] = $user['last_name'];

            return [
                'success' => true,
                'message' => 'Inicio de sesión exitoso',
                'user' => $user
            ];

        } catch (PDOException $e) {
            error_log("Error en login: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al iniciar sesión. Por favor, intente nuevamente.'
            ];
        }
    }

    /**
     * Obtener usuario por ID
     */
    public function getUserById($user_id) {
        try {
            $stmt = $this->conn->prepare(
                "SELECT user_id, first_name, last_name, email FROM users WHERE user_id = :user_id LIMIT 1"
            );
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                $user['firstName'] = $user['first_name'];
                $user['lastName'] = $user['last_name'];
            }

            return $user;

        } catch (PDOException $e) {
            error_log("Error en getUserById: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Verifica si un email ya existe
     */
    private function emailExists($email) {
        $query = "SELECT COUNT(*) FROM users WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return (int)$stmt->fetchColumn() > 0;
    }

    /**
     * Genera un ID único para el usuario
     */
    private function generateUserId() {
        return 'user_' . time() . '_' . bin2hex(random_bytes(4));
    }

    /**
     * Validaciones estáticas
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    }

    public static function validatePassword($password) {
        return strlen($password) >= 8;
    }
}
