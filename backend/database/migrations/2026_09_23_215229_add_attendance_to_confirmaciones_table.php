<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('confirmaciones', function (Blueprint $table) {
            $table->enum('attendance', ['presente', 'tardanza', 'falta', 'pendiente'])->default('pendiente')->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('confirmaciones', function (Blueprint $table) {
            $table->dropColumn('attendance');
        });
    }
};
