<?php

// 1. Create Migration File
$migrationContent = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::table('users', function (Blueprint \$table) {
            \$table->index('is_approved');
            \$table->index('role');
            \$table->index('dni');
            \$table->index('phone');
        });
        Schema::table('confirmaciones', function (Blueprint \$table) {
            \$table->index('status');
            \$table->index('match_role');
        });
        Schema::table('multas', function (Blueprint \$table) {
            \$table->index('status');
        });
        Schema::table('events', function (Blueprint \$table) {
            \$table->index('status');
        });
        Schema::table('posts', function (Blueprint \$table) {
            \$table->index('status');
        });
    }
    public function down() {
        Schema::table('users', function (Blueprint \$table) {
            \$table->dropIndex(['is_approved']);
            \$table->dropIndex(['role']);
            \$table->dropIndex(['dni']);
            \$table->dropIndex(['phone']);
        });
        Schema::table('confirmaciones', function (Blueprint \$table) {
            \$table->dropIndex(['status']);
            \$table->dropIndex(['match_role']);
        });
        Schema::table('multas', function (Blueprint \$table) {
            \$table->dropIndex(['status']);
        });
        Schema::table('events', function (Blueprint \$table) {
            \$table->dropIndex(['status']);
        });
        Schema::table('posts', function (Blueprint \$table) {
            \$table->dropIndex(['status']);
        });
    }
};
";
file_put_contents(__DIR__ . '/database/migrations/2026_09_27_010000_add_performance_indexes.php', $migrationContent);

// 2. Update GalleryController.php
$gcPath = __DIR__ . '/app/Http/Controllers/GalleryController.php';
$gcContent = file_get_contents($gcPath);
$gcContent = str_replace(
    "return GalleryResource::collection(Gallery::withCount('media')->get());",
    "return GalleryResource::collection(Gallery::withCount('media')->paginate(12));",
    $gcContent
);
file_put_contents($gcPath, $gcContent);

// 3. Update MultaController.php
$mcPath = __DIR__ . '/app/Http/Controllers/MultaController.php';
$mcContent = file_get_contents($mcPath);
$mcContent = str_replace(
    "\$multas = Multa::with(['user', 'convocatoria'])->orderBy('created_at', 'desc')->get();",
    "\$multas = Multa::with(['user', 'convocatoria'])->orderBy('created_at', 'desc')->paginate(20);",
    $mcContent
);
$mcContent = str_replace(
    "\$multas = Multa::with(['convocatoria'])->where('user_id', \$request->user()->id)->orderBy('created_at', 'desc')->get();",
    "\$multas = Multa::with(['convocatoria'])->where('user_id', \$request->user()->id)->orderBy('created_at', 'desc')->paginate(20);",
    $mcContent
);
file_put_contents($mcPath, $mcContent);

// 4. Update DashboardController.php
$dcPath = __DIR__ . '/app/Http/Controllers/DashboardController.php';
$dcContent = file_get_contents($dcPath);

// Patch upcomingConvocatorias
$dcContent = str_replace(
    "            ->with('creator')",
    "            ->with('creator')\n            ->withCount(['confirmaciones as confirmed_count' => function(\$q) { \$q->where('status', 'confirmado'); }])",
    $dcContent
);

// Patch myEvents (where it has withCount('registrations'))
$dcContent = preg_replace(
    "/(->whereHas\('registrations'.*?\n\s*}\))/is",
    "$1\n            ->withCount('registrations')",
    $dcContent
);

file_put_contents($dcPath, $dcContent);

// 5. Update Dockerfile
$dfPath = __DIR__ . '/Dockerfile';
$dfContent = file_get_contents($dfPath);
$dfContent = str_replace(
    "&& docker-php-ext-install pdo pdo_mysql pdo_pgsql gd zip",
    "&& docker-php-ext-install pdo pdo_mysql pdo_pgsql gd zip opcache",
    $dfContent
);
$dfContent .= "\nRUN echo 'opcache.enable=1' >> /usr/local/etc/php/conf.d/opcache.ini && \\\n    echo 'opcache.memory_consumption=128' >> /usr/local/etc/php/conf.d/opcache.ini && \\\n    echo 'opcache.max_accelerated_files=10000' >> /usr/local/etc/php/conf.d/opcache.ini && \\\n    echo 'opcache.validate_timestamps=0' >> /usr/local/etc/php/conf.d/opcache.ini\n\nRUN php artisan config:cache && \\\n    php artisan route:cache && \\\n    php artisan view:cache\n";
file_put_contents($dfPath, $dfContent);

echo "Patch 1 completed.";
