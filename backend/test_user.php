<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::create([
    'name' => 'HENRY GALLARDO',
    'email' => 'Healgayn@gmail.com',
    'dni' => '71346613',
    'phone' => '997658881',
    'position' => null,
    'jersey_number' => null,
    'role' => 'member',
    'status' => 'active',
    'password' => bcrypt('71346613'),
    'is_approved' => true
]);
echo json_encode(new \App\Http\Resources\UserResource($user));
