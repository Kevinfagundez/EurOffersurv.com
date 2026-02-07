FROM php:8.2-cli

# Instalar dependencias necesarias para PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo_pgsql pgsql \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos el backend
COPY backend/ .

EXPOSE 8080

CMD ["php", "-S", "0.0.0.0:8080"]
