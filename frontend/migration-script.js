// ========================================
// SCRIPT DE MIGRACIÓN - LOCALSTORAGE A POSTGRESQL
// Solo ejecutar UNA VEZ para migrar usuarios existentes
// ========================================

/**
 * Este script migra usuarios del sistema antiguo (localStorage)
 * al nuevo sistema (PostgreSQL + Backend PHP)
 */

async function migrateUsersToBackend() {
    console.log('🔄 Iniciando migración de usuarios...');

    // Obtener usuarios del localStorage antiguo
    const usersJson = localStorage.getItem('euroffersurv_users');
    
    if (!usersJson) {
        console.log('❌ No se encontraron usuarios para migrar');
        return {
            success: false,
            message: 'No hay usuarios en localStorage'
        };
    }

    let users;
    try {
        users = JSON.parse(usersJson);
    } catch (error) {
        console.error('Error al parsear usuarios:', error);
        return {
            success: false,
            message: 'Error al leer usuarios de localStorage'
        };
    }

    if (!Array.isArray(users) || users.length === 0) {
        console.log('❌ No hay usuarios para migrar');
        return {
            success: false,
            message: 'Lista de usuarios vacía'
        };
    }

    console.log(`📊 Encontrados ${users.length} usuarios para migrar`);

    const results = {
        total: users.length,
        migrated: 0,
        failed: 0,
        errors: []
    };

    // Migrar cada usuario
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        console.log(`Migrando usuario ${i + 1}/${users.length}: ${user.email}`);

        try {
            // Preparar datos para el backend
            // NOTA: No podemos recuperar la contraseña original (está hasheada)
            // El usuario tendrá que usar "recuperar contraseña" o se le asigna una temporal
            
            const userData = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                password: 'Temporal123!', // Contraseña temporal - el usuario debe cambiarla
                birthDate: user.birthDate,
                country: user.country,
                city: user.city || '',
                gender: user.gender || 'not-specified',
                newsletter: false
            };

            // Registrar en el backend
            const response = await fetch('/backend/api/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ Usuario migrado: ${user.email}`);
                results.migrated++;

                // Si el usuario tenía balance, necesitamos actualizar manualmente en la BD
                if (user.balance && user.balance > 0) {
                    console.log(`💰 Usuario ${user.email} tiene balance: $${user.balance}`);
                    console.log('   → Debe actualizarse manualmente en la base de datos');
                }
            } else {
                if (result.message.includes('ya está registrado')) {
                    console.log(`⚠️  Usuario ya existe: ${user.email}`);
                    results.migrated++;
                } else {
                    console.error(`❌ Error migrando ${user.email}:`, result.message);
                    results.failed++;
                    results.errors.push({
                        email: user.email,
                        error: result.message
                    });
                }
            }

        } catch (error) {
            console.error(`❌ Error en la migración de ${user.email}:`, error);
            results.failed++;
            results.errors.push({
                email: user.email,
                error: error.message
            });
        }

        // Pequeño delay para no saturar el servidor
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`Total de usuarios: ${results.total}`);
    console.log(`Migrados exitosamente: ${results.migrated}`);
    console.log(`Fallidos: ${results.failed}`);
    
    if (results.errors.length > 0) {
        console.log('\n❌ Errores encontrados:');
        results.errors.forEach(err => {
            console.log(`- ${err.email}: ${err.error}`);
        });
    }

    return results;
}

/**
 * Script SQL para actualizar balances manualmente
 * (ejecutar en pgAdmin después de la migración)
 */
function generateBalanceUpdateSQL() {
    const usersJson = localStorage.getItem('euroffersurv_users');
    if (!usersJson) return null;

    const users = JSON.parse(usersJson);
    const usersWithBalance = users.filter(u => u.balance && u.balance > 0);

    if (usersWithBalance.length === 0) {
        console.log('✅ No hay usuarios con balance para actualizar');
        return null;
    }

    let sql = '-- Script de actualización de balances\n';
    sql += '-- Ejecutar en pgAdmin4 después de la migración\n\n';

    usersWithBalance.forEach(user => {
        sql += `-- Usuario: ${user.email}\n`;
        sql += `UPDATE users SET\n`;
        sql += `  balance = ${user.balance || 0},\n`;
        sql += `  total_earned = ${user.totalEarned || 0},\n`;
        sql += `  completed_offers = ${user.completedOffers || 0}\n`;
        sql += `WHERE email = '${user.email}';\n\n`;
    });

    console.log('📝 Script SQL generado:');
    console.log(sql);

    return sql;
}

/**
 * Limpiar localStorage después de una migración exitosa
 */
function cleanupOldData() {
    if (confirm('⚠️  ¿Estás seguro de que quieres eliminar los datos antiguos de localStorage?\nEsta acción no se puede deshacer.')) {
        localStorage.removeItem('euroffersurv_users');
        localStorage.removeItem('euroffersurv_current_user');
        console.log('✅ Datos antiguos eliminados');
    }
}

// Instrucciones de uso
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           MIGRACIÓN DE LOCALSTORAGE A POSTGRESQL              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  PASO 1: Ejecutar migración                                  ║
║  > migrateUsersToBackend()                                   ║
║                                                               ║
║  PASO 2: Generar SQL para balances                           ║
║  > generateBalanceUpdateSQL()                                ║
║                                                               ║
║  PASO 3: Ejecutar el SQL en pgAdmin4                         ║
║                                                               ║
║  PASO 4: Limpiar localStorage (OPCIONAL)                     ║
║  > cleanupOldData()                                          ║
║                                                               ║
║  NOTA: Todos los usuarios migrados tendrán la contraseña     ║
║        temporal "Temporal123!" y deberán cambiarla           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Exportar funciones
window.migrateUsersToBackend = migrateUsersToBackend;
window.generateBalanceUpdateSQL = generateBalanceUpdateSQL;
window.cleanupOldData = cleanupOldData;
