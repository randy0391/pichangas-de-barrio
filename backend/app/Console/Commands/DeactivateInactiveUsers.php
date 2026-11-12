<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Carbon;

class DeactivateInactiveUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:deactivate-inactive';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deactivates approved members with no confirmed convocatoria registration in the last 30 days.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $cutoff = Carbon::now()->subDays(30);

        $count = User::query()
            ->where('role', 'member')
            ->where('status', 'active')
            ->where('is_approved', true)
            ->whereRaw('COALESCE(last_convocatoria_at, created_at) <= ?', [$cutoff])
            ->update(['status' => 'inactive']);

        $this->info("Deactivated {$count} inactive players.");
        return self::SUCCESS;
    }
}
