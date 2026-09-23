<?php
$baseDir = __DIR__;

// Create Migrations

// Find existing users migration and modify it
$files = glob("$baseDir/database/migrations/*_create_users_table.php");
if (count($files) > 0) {
    $userMigration = file_get_contents($files[0]);
    $newCols = <<<'PHP'
$table->string('phone')->nullable();
            $table->enum('position', ['portero', 'defensa', 'medio', 'delantero'])->nullable();
            $table->integer('jersey_number')->nullable();
            $table->string('avatar')->nullable();
            $table->text('bio')->nullable();
            $table->enum('role', ['admin', 'member'])->default('member');
            $table->enum('status', ['active', 'inactive'])->default('active');
PHP;
    $userMigration = preg_replace("/\\$table->string\('email'\)->unique\(\);/", "$table->string('email')->unique();\n            " . $newCols, $userMigration);
    file_put_contents($files[0], $userMigration);
}

// Ensure database/migrations directory exists
if (!is_dir("$baseDir/database/migrations")) {
    mkdir("$baseDir/database/migrations", 0755, true);
}

// Clean existing other migrations (if any left from previous steps like personal access tokens, we leave them)

// Create rest of migrations
$date = date('Y_m_d_His');
$migrations = [
    'create_posts_table' => <<<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('content');
            $table->string('featured_image')->nullable();
            $table->enum('category', ['noticia', 'anuncio', 'novedad']);
            $table->enum('status', ['borrador', 'publicado'])->default('borrador');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
PHP,
    'create_events_table' => <<<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('location');
            $table->date('event_date');
            $table->time('event_time');
            $table->string('cover_image')->nullable();
            $table->enum('status', ['proximo', 'completado', 'cancelado'])->default('proximo');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
PHP,
    'create_event_registrations_table' => <<<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['registrado', 'cancelado'])->default('registrado');
            $table->timestamps();
            
            $table->unique(['event_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_registrations');
    }
};
PHP,
    'create_convocatorias_table' => <<<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('convocatorias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('location');
            $table->date('match_date');
            $table->time('match_time');
            $table->integer('max_players')->default(22);
            $table->string('rival')->nullable();
            $table->enum('status', ['abierta', 'cerrada', 'completada', 'cancelada'])->default('abierta');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('convocatorias');
    }
};
PHP,
    'create_confirmaciones_table' => <<<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('confirmaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('convocatoria_id')->constrained('convocatorias')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['confirmado', 'rechazado', 'pendiente'])->default('pendiente');
            $table->text('notes')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
            
            $table->unique(['convocatoria_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('confirmaciones');
    }
};
PHP,
    'create_galleries_table' => <<<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('galleries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('cover_image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('galleries');
    }
};
PHP,
    'create_media_table' => <<<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gallery_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['foto', 'video']);
            $table->string('file_path');
            $table->string('thumbnail_path')->nullable();
            $table->string('title')->nullable();
            $table->text('caption')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
PHP
];

$i = 1;
foreach ($migrations as $name => $content) {
    $time = date('Y_m_d_His', strtotime("+$i seconds"));
    file_put_contents("$baseDir/database/migrations/{$time}_{$name}.php", $content);
    $i++;
}

echo "Migrations created.\n";
