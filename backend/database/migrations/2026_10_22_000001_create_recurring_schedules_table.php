<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_schedules', function (Blueprint $table) {
            $table->id();
            // Carbon day of week: 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 0/7 = Sunday
            $table->unsignedTinyInteger('day_of_week');
            $table->string('day_name', 20); // Martes, Jueves, Sabado
            $table->string('title');
            $table->text('description')->nullable();
            $table->time('match_time')->default('20:00:00');
            $table->decimal('cost_per_player', 8, 2)->default(15.00);
            $table->string('location')->default('Cancha Sintetica Oficial');
            $table->string('maps_url')->nullable();
            $table->unsignedInteger('max_players')->default(14);
            $table->unsignedInteger('num_teams')->default(2);
            $table->boolean('is_active')->default(true);
            $table->unsignedTinyInteger('weeks_ahead')->default(4);
            $table->timestamps();
        });

        // Insert initial recurring schedule requested by user:
        // Martes: 15 soles, Jueves: 15 soles, Sabados: 18 soles
        DB::table('recurring_schedules')->insert([
            [
                'day_of_week' => 2, // Martes
                'day_name' => 'Martes',
                'title' => 'Pichanga de los Martes',
                'description' => 'Pichanga oficial de los Martes en Pichangas de Barrio FC. Costo por cupo: S/ 15.00.',
                'match_time' => '20:00:00',
                'cost_per_player' => 15.00,
                'location' => 'Cancha Sintetica Oficial',
                'maps_url' => null,
                'max_players' => 14,
                'num_teams' => 2,
                'is_active' => true,
                'weeks_ahead' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'day_of_week' => 4, // Jueves
                'day_name' => 'Jueves',
                'title' => 'Pichanga de los Jueves',
                'description' => 'Pichanga oficial de los Jueves en Pichangas de Barrio FC. Costo por cupo: S/ 15.00.',
                'match_time' => '20:00:00',
                'cost_per_player' => 15.00,
                'location' => 'Cancha Sintetica Oficial',
                'maps_url' => null,
                'max_players' => 14,
                'num_teams' => 2,
                'is_active' => true,
                'weeks_ahead' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'day_of_week' => 6, // Sabado
                'day_name' => 'Sabado',
                'title' => 'Pichanga de los Sabados',
                'description' => 'Pichanga estelar de los Sabados en Pichangas de Barrio FC. Costo por cupo: S/ 18.00.',
                'match_time' => '18:00:00',
                'cost_per_player' => 18.00,
                'location' => 'Cancha Sintetica Oficial',
                'maps_url' => null,
                'max_players' => 14,
                'num_teams' => 2,
                'is_active' => true,
                'weeks_ahead' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_schedules');
    }
};
