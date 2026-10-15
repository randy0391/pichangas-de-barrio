<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('convocatorias', function (Blueprint $table) {
            $table->decimal('cost_per_player', 8, 2)->default(0)->after('max_players');
        });
    }

    public function down(): void {
        Schema::table('convocatorias', function (Blueprint $table) {
            $table->dropColumn('cost_per_player');
        });
    }
};
