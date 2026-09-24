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
            'name' => 'Administrador',
            'email' => 'admin@pichangas.com',
            'phone' => '987654321',
            'dni' => '12345678',
            'password' => Hash::make('12345678'),
            'role' => 'admin',
            'is_approved' => 'true',
        ]);
    }
}