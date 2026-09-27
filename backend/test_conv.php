<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $convocatorias = \App\Models\Convocatoria::all();
    $resources = \App\Http\Resources\ConvocatoriaResource::collection($convocatorias);
    echo json_encode($resources);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
