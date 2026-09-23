<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin Pichangas',
            'email' => 'admin@pichangas.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
    }
}