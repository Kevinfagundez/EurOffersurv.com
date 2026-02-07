# 🚀 EUROFFERSURV - GUÍA DE INSTALACIÓN Y CONFIGURACIÓN

## 📋 ÍNDICE
1. [Requisitos del Sistema](#requisitos)
2. [Estructura del Proyecto](#estructura)
3. [Instalación Paso a Paso](#instalación)
4. [Configuración de Base de Datos](#base-de-datos)
5. [Configuración de TheoremReach](#theoremreach)
6. [Testing Local](#testing)
7. [Despliegue a Producción](#producción)
8. [Solución de Problemas](#problemas)

---

## 📦 REQUISITOS DEL SISTEMA {#requisitos}

### Software Necesario:
- **PHP**: 7.4 o superior (recomendado: 8.0+)
- **PostgreSQL**: 12 o superior
- **Apache**: 2.4+ (o Nginx)
- **Extensiones PHP requeridas**:
  - php-pgsql (PostgreSQL)
  - php-pdo
  - php-json
  - php-session

### Herramientas de Desarrollo:
- pgAdmin4 (para administrar PostgreSQL)
- Navegador web moderno
- Editor de texto/IDE

---

## 📁 ESTRUCTURA DEL PROYECTO {#estructura}

```
euroffersurv/
│
├── backend/
│   ├── api/
│   │   ├── register.php          # Endpoint de registro
│   │   ├── login.php              # Endpoint de login
│   │   ├── logout.php             # Endpoint de logout
│   │   ├── check-session.php      # Verificación de sesión
│   │   ├── user-data.php          # Datos del usuario
│   │   └── postback.php           # Postback de TheoremReach
│   │
│   ├── classes/
│   │   ├── User.php               # Clase para manejo de usuarios
│   │   └── Transaction.php        # Clase para transacciones
│   │
│   ├── config/
│   │   └── database.php           # Configuración de base de datos
│   │
│   ├── database/
│   │   └── schema.sql             # Esquema de base de datos
│   │
│   └── logs/
│       └── postback.log           # Log de postbacks (se crea automáticamente)
│
├── frontend/
│   ├── index.html                 # Landing page con login
│   ├── register.html              # Página de registro
│   ├── dashboard.html             # Dashboard con TheoremReach
│   ├── auth.js                    # Sistema de autenticación
│   ├── app.js                     # Lógica de la aplicación
│   ├── theoremreach-integration.js # Integración de TheoremReach
│   ├── styles.css                 # Estilos
│   ├── terms.html                 # Términos y condiciones
│   ├── politics.html              # Política de privacidad
│   └── img/                       # Imágenes
│
├── .htaccess                      # Configuración de Apache
└── README.md                      # Este archivo
```

---

## 🔧 INSTALACIÓN PASO A PASO {#instalación}

### 1. Preparar el Entorno

```bash
# Clonar o descargar el proyecto
cd /ruta/donde/quieras/instalar

# Asegurarse de que Apache y PostgreSQL estén corriendo
sudo systemctl start apache2
sudo systemctl start postgresql
```

### 2. Configurar Permisos

```bash
# Dar permisos de escritura a la carpeta de logs
mkdir -p backend/logs
chmod 777 backend/logs
```

---

## 🗄️ CONFIGURACIÓN DE BASE DE DATOS {#base-de-datos}

### 1. Crear la Base de Datos

Abre pgAdmin4 o psql:

```sql
-- Crear la base de datos
CREATE DATABASE euroffersurv_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = 50;
```

### 2. Importar el Esquema

```bash
# Desde terminal:
psql -U postgres -d euroffersurv_db -f backend/database/schema.sql

# O desde pgAdmin4:
# Tools > Query Tool > Abrir backend/database/schema.sql > Ejecutar
```

### 3. Configurar Credenciales

Edita `backend/config/database.php`:

```php
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'euroffersurv_db');
define('DB_USER', 'postgres');          // TU USUARIO
define('DB_PASS', 'tu_password_aqui');  // TU CONTRASEÑA
```

### 4. Verificar Conexión

Crea un archivo test:

```php
// test-db.php
<?php
require_once 'backend/config/database.php';
$db = Database::getInstance();
echo "✅ Conexión exitosa a PostgreSQL!";
?>
```

Accede a: `http://localhost/test-db.php`

---

## 🎯 CONFIGURACIÓN DE THEOREMREACH {#theoremreach}

### 1. Configurar el App ID

El proyecto ya tiene configurado el `app_id: 24592`.

Si necesitas cambiar esto:
- Edita `frontend/theoremreach-integration.js`
- Cambia la línea: `app_id: 24592`

### 2. Configurar la URL de Postback

En el panel de TheoremReach:

1. Ve a **Settings > Postback**
2. Configura la URL:

```
https://tudominio.com/backend/api/postback.php?user_id={user_id}&reward={reward}&transaction_id={transaction_id}
```

**IMPORTANTE**: 
- Reemplaza `tudominio.com` con tu dominio real
- Para testing local usa: `http://tu-ip-publica/backend/api/postback.php...`
- TheoremReach necesita acceso público para enviar postbacks

### 3. Testing del Postback (Local)

Para testing local necesitas exponer tu servidor. Usa **ngrok**:

```bash
# Instalar ngrok
# Descargar de: https://ngrok.com/download

# Exponer puerto 80
./ngrok http 80

# Copiar la URL que te da (ej: https://abc123.ngrok.io)
# Usar esa URL en la configuración de TheoremReach
```

---

## 🧪 TESTING LOCAL {#testing}

### 1. Configurar Virtual Host (Opcional pero Recomendado)

Edita `/etc/hosts`:

```
127.0.0.1   euroffersurv.local
```

Crea un virtual host en Apache:

```apache
<VirtualHost *:80>
    ServerName euroffersurv.local
    DocumentRoot /ruta/a/euroffersurv/frontend
    
    <Directory /ruta/a/euroffersurv/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /backend /ruta/a/euroffersurv/backend
    <Directory /ruta/a/euroffersurv/backend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Reiniciar Apache:

```bash
sudo systemctl restart apache2
```

### 2. Probar el Registro

1. Abre: `http://euroffersurv.local/register.html`
2. Registra un usuario de prueba
3. Verifica en la base de datos:

```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 1;
```

### 3. Probar el Login

1. Abre: `http://euroffersurv.local/`
2. Inicia sesión con el usuario creado
3. Deberías ser redirigido a `dashboard.html`

### 4. Verificar TheoremReach

En el dashboard:
- Abre la consola del navegador (F12)
- Busca mensajes de "TheoremReach inicializado"
- Deberías ver la offerwall cargando

---

## 🚀 DESPLIEGUE A PRODUCCIÓN {#producción}

### 1. Preparar el Servidor

```bash
# Instalar dependencias
sudo apt update
sudo apt install apache2 postgresql php php-pgsql php-pdo

# Habilitar módulos de Apache
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

### 2. Subir Archivos

```bash
# Subir vía FTP/SFTP o Git
# Estructura recomendada:
/var/www/html/
├── backend/
└── frontend/ (raíz del dominio)
```

### 3. Configurar SSL (OBLIGATORIO para producción)

```bash
# Con Let's Encrypt (Certbot)
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d tudominio.com
```

### 4. Configurar Base de Datos en Producción

```sql
-- Crear usuario específico para la aplicación
CREATE USER euroffersurv_user WITH PASSWORD 'password_super_seguro';
GRANT ALL PRIVILEGES ON DATABASE euroffersurv_db TO euroffersurv_user;
```

Actualiza `backend/config/database.php` con las credenciales de producción.

### 5. Asegurar el Backend

```apache
# En .htaccess del backend
<Directory "/var/www/html/backend/config">
    Deny from all
</Directory>

<Directory "/var/www/html/backend/logs">
    Deny from all
</Directory>
```

### 6. Actualizar URLs

En `frontend/auth.js`, cambia:

```javascript
this.API_BASE = '/backend/api';  // Producción
// o
this.API_BASE = 'https://tudominio.com/backend/api';
```

---

## 🔍 TESTING DEL POSTBACK

### Test Manual del Postback

```bash
# Simular una llamada de TheoremReach
curl "http://tudominio.com/backend/api/postback.php?user_id=user_123456&reward=150&transaction_id=tx_test_001"

# Deberías recibir:
# {"status":"ok","message":"Recompensa procesada exitosamente",...}
```

### Verificar en Base de Datos

```sql
-- Ver última transacción
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 1;

-- Ver balance actualizado
SELECT user_id, balance, total_earned, completed_offers 
FROM users 
WHERE user_id = 'user_123456';
```

### Logs de Postback

```bash
# Ver log de postbacks
tail -f backend/logs/postback.log
```

---

## ❗ SOLUCIÓN DE PROBLEMAS {#problemas}

### Error: "No se puede conectar a la base de datos"

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar credenciales
psql -U postgres -d euroffersurv_db

# Verificar extensión PHP
php -m | grep pgsql
```

### Error: "TheoremReach no carga"

1. Verifica en la consola del navegador
2. Verifica que el `user_id` se esté pasando correctamente
3. Comprueba que el dominio esté en la lista blanca de TheoremReach

### Error: "Postback no se recibe"

1. Verifica que la URL sea pública (no localhost)
2. Verifica los logs: `backend/logs/postback.log`
3. Haz un test manual con curl
4. Contacta soporte de TheoremReach para verificar configuración

### Sessions no funcionan

```php
// Añade al inicio de cada endpoint:
ini_set('session.cookie_samesite', 'Lax');
session_start();
```

---

## 📊 CAPACIDAD DE LA BASE DE DATOS

La base de datos actual está diseñada para **~50 usuarios iniciales**, pero puede escalar fácilmente:

- **50-100 usuarios**: Sin cambios necesarios
- **100-1,000 usuarios**: Añadir índices adicionales
- **1,000+ usuarios**: Considerar particionamiento de tablas

### Optimizar para más usuarios:

```sql
-- Índices adicionales
CREATE INDEX idx_transactions_status_created ON transactions(status, created_at);
CREATE INDEX idx_users_active_created ON users(is_active, created_at);

-- Analizar rendimiento
ANALYZE users;
ANALYZE transactions;
```

---

## 🆘 SOPORTE

Si necesitas ayuda:
1. Revisa los logs: `backend/logs/postback.log`
2. Verifica logs de Apache: `/var/log/apache2/error.log`
3. Verifica logs de PostgreSQL: `/var/log/postgresql/postgresql-XX-main.log`

---

## ✅ CHECKLIST DE REVISIÓN PARA THEOREMREACH

Antes de solicitar aprobación de TheoremReach:

- [ ] SSL configurado (HTTPS)
- [ ] Postback URL configurada correctamente
- [ ] Postback responde con HTTP 200 OK
- [ ] user_id se pasa correctamente desde el frontend
- [ ] Transacciones se registran sin duplicados
- [ ] Balance se actualiza correctamente
- [ ] La offerwall se muestra correctamente en el sitio
- [ ] Política de privacidad actualizada
- [ ] Términos y condiciones actualizados

---

**¡PROYECTO LISTO PARA USAR!** 🎉
