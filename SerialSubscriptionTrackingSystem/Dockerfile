FROM php:8.2-fpm
 
# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libssl-dev \
    supervisor
 
# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath
RUN pecl install mongodb && docker-php-ext-enable mongodb
 
# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
 
WORKDIR /app
 
# Copy application files
COPY . .
 
# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader
 
# Set permissions
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache
 
EXPOSE 8000
 
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]