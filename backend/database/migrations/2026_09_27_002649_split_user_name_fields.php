<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('name', 'nombres');
            $table->string('apellido_paterno')->nullable();
            $table->string('apellido_materno')->nullable();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('nombres', 'name');
            $table->dropColumn(['apellido_paterno', 'apellido_materno']);
        });
    }
};
