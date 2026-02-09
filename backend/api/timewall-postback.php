<?php
/**
 * TimeWall Postback Handler
 * Procesa las recompensas de TimeWall y las acredita al usuario
 * 
 * URL de configuración en TimeWall:
 * https://tudominio.com/backend/api/timewall-postback.php?uid={user_id}&amount={amount}&currency={currency}&tx_id={transaction_id}
 */

require_once '../config/database.php';
require_once '../classes/User.php';
require_once '../classes/Transaction.php';

// Configurar headers
header('Content-Type: application/json');

// Log de debugging (opcional, comentar en producción)
error_log('[TimeWall Postback] Request recibido: ' . json_encode($_GET));

// Obtener parámetros de TimeWall
$userId = $_GET['uid'] ?? null;
$amount = $_GET['amount'] ?? null;
$currency = $_GET['currency'] ?? 'USD';
$transactionId = $_GET['tx_id'] ?? null;
$surveyName = $_GET['survey_name'] ?? 'TimeWall Survey';
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

// Validar parámetros requeridos
if (!$userId || !$amount || !$transactionId) {
    http_response_code(400);
    $error = [
        'status' => 'error',
        'message' => 'Parámetros faltantes',
        'required' => ['uid', 'amount', 'tx_id'],
        'received' => [
            'uid' => $userId,
            'amount' => $amount,
            'tx_id' => $transactionId
        ]
    ];
    error_log('[TimeWall Postback] Error: ' . json_encode($error));
    echo json_encode($error);
    exit;
}

// Validar que el monto sea numérico y positivo
if (!is_numeric($amount) || $amount <= 0) {
    http_response_code(400);
    $error = [
        'status' => 'error',
        'message' => 'Monto inválido',
        'amount' => $amount
    ];
    error_log('[TimeWall Postback] Error: ' . json_encode($error));
    echo json_encode($error);
    exit;
}

// Convertir amount a float
$amount = floatval($amount);

try {
    $db = Database::getInstance()->getConnection();
    
    // Verificar que el usuario existe
    $stmt = $db->prepare("SELECT id, username FROM users WHERE id = :user_id");
    $stmt->execute([':user_id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        $error = [
            'status' => 'error',
            'message' => 'Usuario no encontrado',
            'user_id' => $userId
        ];
        error_log('[TimeWall Postback] Error: ' . json_encode($error));
        echo json_encode($error);
        exit;
    }
    
    // Verificar si la transacción ya existe (prevenir duplicados)
    $stmt = $db->prepare("
        SELECT id, created_at FROM transactions 
        WHERE external_transaction_id = :tx_id 
        AND source = 'timewall'
    ");
    $stmt->execute([':tx_id' => $transactionId]);
    $existingTransaction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingTransaction) {
        // Transacción duplicada - retornar éxito para que TimeWall no reintente
        $response = [
            'status' => 'success',
            'message' => 'Transacción duplicada',
            'transaction_id' => $existingTransaction['id'],
            'original_date' => $existingTransaction['created_at']
        ];
        error_log('[TimeWall Postback] Duplicado detectado: ' . json_encode($response));
        echo json_encode($response);
        exit;
    }
    
    // Iniciar transacción de base de datos
    $db->beginTransaction();
    
    try {
        // Registrar la transacción
        $transaction = new Transaction($db);
        $result = $transaction->create(
            $userId,
            $amount,
            'credit',
            'timewall_survey',
            "TimeWall Survey: {$surveyName}",
            $transactionId
        );
        
        if (!$result) {
            throw new Exception('Error al crear la transacción');
        }
        
        // Actualizar el balance del usuario
        $stmt = $db->prepare("
            UPDATE users 
            SET balance = balance + :amount,
                total_earned = total_earned + :amount,
                completed_surveys = completed_surveys + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :user_id
        ");
        
        $updateResult = $stmt->execute([
            ':amount' => $amount,
            ':user_id' => $userId
        ]);
        
        if (!$updateResult) {
            throw new Exception('Error al actualizar el balance del usuario');
        }
        
        // Log de la operación exitosa
        $logStmt = $db->prepare("
            INSERT INTO postback_logs 
            (user_id, source, transaction_id, amount, ip_address, status, raw_data) 
            VALUES 
            (:user_id, 'timewall', :tx_id, :amount, :ip, 'success', :raw_data)
        ");
        
        $logStmt->execute([
            ':user_id' => $userId,
            ':tx_id' => $transactionId,
            ':amount' => $amount,
            ':ip' => $ip,
            ':raw_data' => json_encode($_GET)
        ]);
        
        // Commit de la transacción
        $db->commit();
        
        // Respuesta exitosa
        $response = [
            'status' => 'success',
            'message' => 'Recompensa acreditada correctamente',
            'user_id' => $userId,
            'username' => $user['username'],
            'amount' => $amount,
            'currency' => $currency,
            'transaction_id' => $transactionId
        ];
        
        error_log('[TimeWall Postback] Éxito: ' . json_encode($response));
        echo json_encode($response);
        
    } catch (Exception $e) {
        // Rollback en caso de error
        $db->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    $error = [
        'status' => 'error',
        'message' => 'Error interno del servidor',
        'details' => $e->getMessage()
    ];
    
    error_log('[TimeWall Postback] Error crítico: ' . json_encode($error));
    echo json_encode($error);
    
    // Intentar registrar el error en la BD
    try {
        $db = Database::getInstance()->getConnection();
        $logStmt = $db->prepare("
            INSERT INTO postback_logs 
            (user_id, source, transaction_id, amount, ip_address, status, error_message, raw_data) 
            VALUES 
            (:user_id, 'timewall', :tx_id, :amount, :ip, 'error', :error, :raw_data)
        ");
        
        $logStmt->execute([
            ':user_id' => $userId,
            ':tx_id' => $transactionId,
            ':amount' => $amount,
            ':ip' => $ip,
            ':error' => $e->getMessage(),
            ':raw_data' => json_encode($_GET)
        ]);
    } catch (Exception $logError) {
        error_log('[TimeWall Postback] Error al registrar log: ' . $logError->getMessage());
    }
}

/**
 * NOTAS DE CONFIGURACIÓN:
 * 
 * 1. Asegúrate de que tu tabla 'transactions' tenga el campo 'source'
 * 2. Asegúrate de que tu tabla 'users' tenga los campos:
 *    - balance
 *    - total_earned
 *    - completed_surveys
 * 
 * 3. Crea la tabla de logs (opcional pero recomendado):
 * 
 * CREATE TABLE IF NOT EXISTS postback_logs (
 *     id SERIAL PRIMARY KEY,
 *     user_id INTEGER NOT NULL,
 *     source VARCHAR(50) NOT NULL,
 *     transaction_id VARCHAR(255),
 *     amount DECIMAL(10, 2),
 *     ip_address VARCHAR(45),
 *     status VARCHAR(20),
 *     error_message TEXT,
 *     raw_data TEXT,
 *     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * 4. URL de configuración en TimeWall:
 *    https://tudominio.com/backend/api/timewall-postback.php?uid={user_id}&amount={amount}&currency={currency}&tx_id={transaction_id}
 * 
 * 5. Parámetros soportados:
 *    - uid: ID del usuario (requerido)
 *    - amount: Monto a acreditar (requerido)
 *    - tx_id: ID de transacción de TimeWall (requerido)
 *    - currency: Moneda (opcional, default: USD)
 *    - survey_name: Nombre de la encuesta (opcional)
 */
?>