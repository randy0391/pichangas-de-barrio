<?php
// Patch DashboardController adminDashboard recentConvocatorias
$dcPath = __DIR__ . '/app/Http/Controllers/DashboardController.php';
$dcContent = file_get_contents($dcPath);

// The first patch affected only the first instance because of str_replace on a unique string?
// Wait, my previous str_replace was:
// $dcContent = str_replace(
//    "            ->with('creator')",
//    "            ->with('creator')\n            ->withCount(['confirmaciones as confirmed_count' => function(\$q) { \$q->where('status', 'confirmado'); }])",
//    $dcContent
// );
// `str_replace` actually replaces ALL occurrences! So let me check if both were replaced.
// I will output the file to stdout to see.

echo "--- DashboardController ---\n";
echo file_get_contents($dcPath);

// For MultaController, let's fix ->map to ->through
$mcPath = __DIR__ . '/app/Http/Controllers/MultaController.php';
$mcContent = file_get_contents($mcPath);
$mcContent = str_replace('response()->json($multas->map(function ($multa)', 'response()->json($multas->through(function ($multa)', $mcContent);
file_put_contents($mcPath, $mcContent);
