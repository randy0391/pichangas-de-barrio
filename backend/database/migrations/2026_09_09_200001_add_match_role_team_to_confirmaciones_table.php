<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('confirmaciones', function (Blueprint $table) {
            $table->enum('match_role', ['jugador', 'portero'])->default('jugador')->after('status');
            $table->integer('team_number')->nullable()->after('match_role');
        });
    }

    public function down(): void
    {
        Schema::table('confirmaciones', function (Blueprint $table) {
            $table->dropColumn(['match_role', 'team_number']);
        });
    }
};
