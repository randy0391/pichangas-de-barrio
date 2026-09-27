<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://pichangas-de-barrio.onrender.com/api/login");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['phone' => '955006789', 'password' => 'invalid_password']));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'Origin: https://pichangas-de-barrio.vercel.app'
]);
curl_setopt($ch, CURLOPT_HEADER, 1);
$response = curl_exec($ch);
echo "Response: \n" . $response . "\n";
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "HTTP Code: " . $httpcode . "\n";
curl_close($ch);
