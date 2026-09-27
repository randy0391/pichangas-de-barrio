<?php

$apiPath = __DIR__ . '/routes/api.php';
$content = file_get_contents($apiPath);

// Remove the old routes
$content = preg_replace("/\/\/ Temporary public route.*?\\}\\);/is", "", $content, 1);
$content = preg_replace("/Route::get\('\/logs', function \(\) \\{.*?\\}\\);/is", "", $content, 1);

// Add them inside auth:sanctum group
$replacement = "
    // Security protected routes
    Route::get('/run-migrations', function (\\Illuminate\\Http\\Request \$request) {
        if (!\$request->user()->isAdmin()) return response()->json(['error' => 'Unauthorized'], 403);
        \\Illuminate\\Support\\Facades\\Artisan::call('migrate', ['--force' => true]);
        return response()->json(['message' => 'OK', 'output' => \\Illuminate\\Support\\Facades\\Artisan::output()]);
    });

    Route::get('/logs', function (\\Illuminate\\Http\\Request \$request) {
        if (!\$request->user()->isAdmin()) return response()->json(['error' => 'Unauthorized'], 403);
        \$path = storage_path('logs/laravel.log');
        if (!file_exists(\$path)) return 'No log file';
        return response(file_get_contents(\$path), 200)->header('Content-Type', 'text/plain');
    });
";

// Insert at the beginning of auth:sanctum group
$content = preg_replace("/(Route::middleware\('auth:sanctum'\)->group\(function \(\) \{)/", "$1" . $replacement, $content, 1);

file_put_contents($apiPath, $content);
echo "Patched api.php";
