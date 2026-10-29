<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('convocatorias') && !Schema::hasColumn('convocatorias', 'draw_metadata')) {
            Schema::table('convocatorias', function (Blueprint $table) {
                $table->json('draw_metadata')->nullable()->after('num_teams');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('convocatorias') && Schema::hasColumn('convocatorias', 'draw_metadata')) {
            Schema::table('convocatorias', function (Blueprint $table) {
                $table->dropColumn('draw_metadata');
            });
        }
    }
};
