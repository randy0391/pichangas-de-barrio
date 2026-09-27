<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::table('users', function (Blueprint $table) {
            $table->index('is_approved');
            $table->index('role');
            $table->index('dni');
            $table->index('phone');
        });
        Schema::table('confirmaciones', function (Blueprint $table) {
            $table->index('status');
            $table->index('match_role');
        });
        Schema::table('multas', function (Blueprint $table) {
            $table->index('status');
        });
        Schema::table('events', function (Blueprint $table) {
            $table->index('status');
        });
        Schema::table('posts', function (Blueprint $table) {
            $table->index('status');
        });
    }
    public function down() {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_approved']);
            $table->dropIndex(['role']);
            $table->dropIndex(['dni']);
            $table->dropIndex(['phone']);
        });
        Schema::table('confirmaciones', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['match_role']);
        });
        Schema::table('multas', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
    }
};
