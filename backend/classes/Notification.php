<?php
/**
 * Clase Notification - Manejo de notificaciones
 */

require_once __DIR__ . '/../config/database.php';

class Notification {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
    }

    public function getUnreadCount(string $userId): int {
        $stmt = $this->conn->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND is_read = FALSE");
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        return (int)$stmt->fetchColumn();
    }

    public function getLatest(string $userId, int $limit = 20): array {
        $stmt = $this->conn->prepare("
            SELECT id, title, message, type, is_read, created_at
            FROM notifications
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT :limit
        ");
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function markAllRead(string $userId): bool {
        $stmt = $this->conn->prepare("UPDATE notifications SET is_read = TRUE WHERE user_id = :user_id AND is_read = FALSE");
        $stmt->bindParam(':user_id', $userId);
        return $stmt->execute();
    }

    // Útil para pruebas / eventos del sistema
    public function create(string $userId, string $title, string $message, string $type = 'info'): bool {
        $stmt = $this->conn->prepare("
            INSERT INTO notifications (user_id, title, message, type, is_read)
            VALUES (:user_id, :title, :message, :type, FALSE)
        ");
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':message', $message);
        $stmt->bindParam(':type', $type);
        return $stmt->execute();
    }
}
