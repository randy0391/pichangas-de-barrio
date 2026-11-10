<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_convocatoria_at')->nullable()->after('status')->index();
        });

        // Preserve historic activity where a confirmed registration already has a timestamp.
        DB::statement("
            UPDATE users
            SET last_convocatoria_at = (
                SELECT MAX(confirmaciones.confirmed_at)
                FROM confirmaciones
                WHERE confirmaciones.user_id = users.id
                  AND confirmaciones.status = 'confirmado'
                  AND confirmaciones.confirmed_at IS NOT NULL
            )
            WHERE EXISTS (
                SELECT 1 FROM confirmaciones
                WHERE confirmaciones.user_id = users.id
                  AND confirmaciones.status = 'confirmado'
                  AND confirmaciones.confirmed_at IS NOT NULL
            )
        ");
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['last_convocatoria_at']);
            $table->dropColumn('last_convocatoria_at');
        });
    }
};
