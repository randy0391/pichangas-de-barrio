<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update Martes to 21:00 (9:00 PM)
        DB::table('recurring_schedules')
            ->where('day_of_week', 2)
            ->update([
                'match_time' => '21:00:00',
                'description' => 'Pichanga oficial de los Martes a las 9:00 PM en Pichangas de Barrio FC. Costo por cupo: S/ 15.00.'
            ]);

        // Update Jueves to 21:00 (9:00 PM)
        DB::table('recurring_schedules')
            ->where('day_of_week', 4)
            ->update([
                'match_time' => '21:00:00',
                'description' => 'Pichanga oficial de los Jueves a las 9:00 PM en Pichangas de Barrio FC. Costo por cupo: S/ 15.00.'
            ]);

        // Update Sabado to 06:00 (6:00 AM)
        DB::table('recurring_schedules')
            ->where('day_of_week', 6)
            ->update([
                'match_time' => '06:00:00',
                'description' => 'Pichanga matutina de los Sabados a las 6:00 AM en Pichangas de Barrio FC. Costo por cupo: S/ 18.00.'
            ]);

        // Also update any future convocatorias matching these titles
        DB::table('convocatorias')
            ->where('title', 'like', '%Martes%')
            ->where('match_date', '>=', now()->toDateString())
            ->update(['match_time' => '21:00:00']);

        DB::table('convocatorias')
            ->where('title', 'like', '%Jueves%')
            ->where('match_date', '>=', now()->toDateString())
            ->update(['match_time' => '21:00:00']);

        DB::table('convocatorias')
            ->where('title', 'like', '%Sabado%')
            ->where('match_date', '>=', now()->toDateString())
            ->update(['match_time' => '06:00:00']);
    }

    public function down(): void
    {
        DB::table('recurring_schedules')->where('day_of_week', 2)->update(['match_time' => '20:00:00']);
        DB::table('recurring_schedules')->where('day_of_week', 4)->update(['match_time' => '20:00:00']);
        DB::table('recurring_schedules')->where('day_of_week', 6)->update(['match_time' => '18:00:00']);
    }
};
