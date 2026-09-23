<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Carbon\Carbon;

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
    protected $description = 'Deactivates users who have not participated in any event or convocatoria for 2 months.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $twoMonthsAgo = Carbon::now()->subMonths(2);
        
        $inactiveUsers = User::where('status', 'active')
            ->where('role', 'member') // Let's keep admins active
            ->whereDoesntHave('confirmaciones', function ($query) use ($twoMonthsAgo) {
                $query->where('created_at', '>=', $twoMonthsAgo);
            })
            ->whereDoesntHave('eventRegistrations', function ($query) use ($twoMonthsAgo) {
                $query->where('created_at', '>=', $twoMonthsAgo);
            })
            // Also ensure they were created more than 2 months ago, giving new users a grace period
            ->where('created_at', '<', $twoMonthsAgo)
            ->get();

        $count = 0;
        foreach ($inactiveUsers as $user) {
            $user->status = 'inactive';
            $user->save();
            $count++;
        }

        $this->info("Deactivated {$count} inactive users.");
    }
}
