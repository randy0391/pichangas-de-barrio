<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ConvocatoriaController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\DashboardController;

// Public routes
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{slug}', [PostController::class, 'show']);
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);
Route::get('/galleries', [GalleryController::class, 'index']);
Route::get('/galleries/{id}', [GalleryController::class, 'show']);

// Home Data
Route::get('/home-data', [\App\Http\Controllers\PublicHomeController::class, 'index']);

// Temporary public route to migrate DB on Render Free tier
Route::get('/run-migrations', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        return response()->json(['message' => 'Migraciones ejecutadas exitosamente', 'output' => \Illuminate\Support\Facades\Artisan::output()]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});



Route::get('/logs', function () {
    $path = storage_path('logs/laravel.log');
    if (!file_exists($path)) return 'No log file';
    return response(file_get_contents($path), 200)->header('Content-Type', 'text/plain');
});

// Auth routes (with strict rate limiting against brute force)
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'updateProfile']);
    Route::post('/user/avatar', [AuthController::class, 'updateAvatar']);

    // Events
    Route::post('/events/{id}/register', [EventController::class, 'register']);
    Route::post('/events/{id}/unregister', [EventController::class, 'unregister']);

    // Convocatorias
    Route::get('/convocatorias', [ConvocatoriaController::class, 'index']);
    Route::get('/convocatorias/mis-convocatorias', [ConvocatoriaController::class, 'misConvocatorias']);
    Route::get('/convocatorias/{id}', [ConvocatoriaController::class, 'show']);
    Route::post('/convocatorias/{id}/confirmar', [ConvocatoriaController::class, 'confirmar']);


    // Members
    Route::get('/members', [MemberController::class, 'index']);
    Route::get('/members/{id}', [MemberController::class, 'show']);

    // Dashboard
    Route::get('/dashboard/user', [DashboardController::class, 'userDashboard']);

    // Multas
    Route::get('/multas', [\App\Http\Controllers\MultaController::class, 'index']);
    Route::post('/multas/{id}/receipt', [\App\Http\Controllers\MultaController::class, 'uploadReceipt']);

    // Admin routes
    Route::middleware('admin')->group(function () {
        Route::post('/multas/{id}/approve', [\App\Http\Controllers\MultaController::class, 'approve']);
        Route::post('/multas/{id}/reject', [\App\Http\Controllers\MultaController::class, 'reject']);
        
        Route::post('/confirmaciones/{id}/attendance', [\App\Http\Controllers\AttendanceController::class, 'mark']);
        Route::get('/admin/attendance-report', [\App\Http\Controllers\AttendanceController::class, 'report']);

        Route::post('/posts', [PostController::class, 'store']);
        Route::put('/posts/{id}', [PostController::class, 'update']);
        Route::delete('/posts/{id}', [PostController::class, 'destroy']);

        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{id}', [EventController::class, 'update']);
        Route::delete('/events/{id}', [EventController::class, 'destroy']);
        Route::delete('/events/{id}/registrations/{userId}', [EventController::class, 'removeRegistration']);

        Route::post('/convocatorias', [ConvocatoriaController::class, 'store']);
        Route::put('/convocatorias/{id}', [ConvocatoriaController::class, 'update']);
        Route::delete('/convocatorias/{id}', [ConvocatoriaController::class, 'destroy']);
        Route::post('/convocatorias/{id}/sortear', [ConvocatoriaController::class, 'sortearEquipos']);
        Route::post('/convocatorias/{id}/add-player', [ConvocatoriaController::class, 'addPlayer']);
        Route::delete('/convocatorias/{id}/confirmaciones/{userId}', [ConvocatoriaController::class, 'removeConfirmacion']);

        Route::post('/galleries', [GalleryController::class, 'store']);
        Route::put('/galleries/{id}', [GalleryController::class, 'update']);
        Route::delete('/galleries/{id}', [GalleryController::class, 'destroy']);

        Route::post('/media/upload', [MediaController::class, 'upload']);
        Route::delete('/media/{id}', [MediaController::class, 'destroy']);

        Route::post('/members', [MemberController::class, 'store']);
        Route::put('/members/{id}', [MemberController::class, 'update']);
        Route::delete('/members/{id}', [MemberController::class, 'destroy']);

        Route::get('/dashboard/admin', [DashboardController::class, 'adminDashboard']);
    });
});






