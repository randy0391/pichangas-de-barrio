<?php

namespace App\\Console\\Commands;

use App\\Models\\User;
use Illuminate\\Console\\Command;
use Illuminate\\Support\\Carbon;

class DeactivateInactiveUsers extends Command
{
    protected $signature = 'users:deactivate-inactive {--dry-run : Only report how many players would be deactivated}';

    protected $description = 'Deactivates approved members with no confirmed convocatoria registration in the last 30 days.';

    public function handle(): int
    {
        $cutoff = Carbon::now()->subDays(30);

        $candidates = User::query()
            ->where('role', 'member')
            ->where('status', 'active')
            ->where('is_approved', true)
            ->whereRaw('COALESCE(last_convocatoria_at, created_at) <= ?', [$cutoff]);

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
