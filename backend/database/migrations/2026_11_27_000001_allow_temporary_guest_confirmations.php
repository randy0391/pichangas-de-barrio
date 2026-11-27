<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE confirmaciones ALTER COLUMN user_id DROP NOT NULL');
        DB::statement('ALTER TABLE confirmaciones ADD COLUMN guest_name VARCHAR(120) NULL');
    }

    public function down(): void
    {
        DB::table('confirmaciones')->whereNull('user_id')->delete();
        DB::statement('ALTER TABLE confirmaciones DROP COLUMN guest_name');
        DB::statement('ALTER TABLE confirmaciones ALTER COLUMN user_id SET NOT NULL');
    }
};
