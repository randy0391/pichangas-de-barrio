<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('convocatorias', function (Blueprint $table) {
            $table->string('maps_url')->nullable()->after('location');
        });
    }

    public function down(): void
    {
        Schema::table('convocatorias', function (Blueprint $table) {
            $table->dropColumn('maps_url');
        });
    }
};
