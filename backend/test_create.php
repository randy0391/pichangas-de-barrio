<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('role', 'admin')->first();
if (!$user) {
    echo "No admin found.";
    exit;
}
$token = $user->createToken('auth')->plainTextToken;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://pichangas-de-barrio.onrender.com/api/members");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'name' => 'HENRY GALLARDO',
    'email' => 'Healgayn2@gmail.com', // changed email to avoid conflict
    'dni' => '713466132', // changed dni
    'phone' => '9976588812', // changed phone
    'position' => 'medio',
    'jersey_number' => 15,
    'role' => 'member',
    'status' => 'active'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Bearer ' . $token,
    'Origin: https://pichangas-de-barrio.vercel.app'
]);
$response = curl_exec($ch);
echo "Response: " . $response . "\n";
curl_close($ch);
