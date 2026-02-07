<?php
/**
 * Clase Transaction - Manejo de transacciones
 */

require_once __DIR__ . '/../config/database.php';

class Transaction {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Crea una transacción de forma idempotente:
     * - si transaction_id ya existe => duplicate = true
     */
    public function create($userId, $transactionId, $amount, $type, $source, $description) {
        try {
            // Intentar insertar. Si ya existe, ON CONFLICT DO NOTHING
            $query = "
                INSERT INTO transactions (user_id, transaction_id, amount, type, source, description, created_at)
                VALUES (:user_id, :transaction_id, :amount, :type, :source, :description, NOW())
                ON CONFLICT (transaction_id) DO NOTHING
                RETURNING id
            ";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':transaction_id', $transactionId);
            $stmt->bindParam(':amount', $amount);
            $stmt->bindParam(':type', $type);
            $stmt->bindParam(':source', $source);
            $stmt->bindParam(':description', $description);
            $stmt->execute();

            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                // No insertó porque ya existía
                return [
                    'success' => true,
                    'duplicate' => true
                ];
            }

            return [
                'success' => true,
                'duplicate' => false,
                'id' => $row['id']
            ];
        } catch (PDOException $e) {
            error_log("Error Transaction::create: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al crear transacción'
            ];
        }
    }
}
