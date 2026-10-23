<?php

namespace App\Console\Commands;

use App\Services\RecurringConvocatoriaService;
use Illuminate\Console\Command;

class GenerateRecurringConvocatorias extends Command
{
    protected $signature = 'convocatorias:generate-recurring {--weeks=4 : Numero de semanas futuras a generar}';
    protected $description = 'Genera convocatorias automaticas para los proximos dias de acuerdo al horario recurrente configurado';

    public function handle(): int
    {
        $weeks = (int) $this->option('weeks');
        $this->info("Iniciando generacion de convocatorias automaticas para las proximas {$weeks} semanas...");

        $result = RecurringConvocatoriaService::generateUpcoming($weeks);

        $this->info($result['message']);
        if ($result['created_count'] > 0) {
            foreach ($result['created_dates'] as $item) {
                $this->line(" - [{$item['date']}] {$item['title']} ({$item['day']}) -> S/ {$item['cost']}");
            }
        }

        return self::SUCCESS;
    }
}
