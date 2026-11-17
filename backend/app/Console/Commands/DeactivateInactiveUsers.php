<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class DeactivateInactiveUsers extends Command
{
    protected $signature = 'users:deactivate-inactive {--dry-run : Only report how many players would be deactivated}';

    protected $description = 'Deactivates approved members with no recent or upcoming confirmed convocatoria registration.';

    public function handle(): int
    {
        $cutoff = Carbon::now()->subDays(30);
        $today = Carbon::today();

        $candidates = User::query()
            ->where('role', 'member')
            ->where('status', 'active')
            ->whereRaw('"is_approved" IS TRUE')
            ->whereRaw('COALESCE(last_convocatoria_at, created_at) <= ?', [$cutoff])
            ->whereNotExists(function ($query) use ($today) {
                $query->selectRaw('1')
                    ->from('confirmaciones')
                    ->join('convocatorias', 'convocatorias.id', '=', 'confirmaciones.convocatoria_id')
                    ->whereColumn('confirmaciones.user_id', 'users.id')
                    ->where('confirmaciones.status', 'confirmado')
                    ->whereDate('convocatorias.match_date', '>=', $today);
            });

        if ($this->option('dry-run')) {
            $count = $candidates->count();
            $this->info("DRY RUN: {$count} inactive players would be deactivated. No records were changed.");

            return self::SUCCESS;
        }

        $count = $candidates->update(['status' => 'inactive']);

        $this->info("Deactivated {$count} inactive players.");

        return self::SUCCESS;
    }
}
