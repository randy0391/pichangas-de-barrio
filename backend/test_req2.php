<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://pichangas-de-barrio.onrender.com/api/convocatorias?page=1");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
// Wait, we need an auth token to get /convocatorias ?
// Let's check routes/api.php
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Origin: https://pichangas-de-barrio.vercel.app'
]);
curl_setopt($ch, CURLOPT_HEADER, 1);
$response = curl_exec($ch);
echo "Response: \n" . $response . "\n";
curl_close($ch);
