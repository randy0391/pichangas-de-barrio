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
Route::get('/recurring-schedules', [\App\Http\Controllers\RecurringScheduleController::class, 'index']);







// Auth routes (with strict rate limiting against brute force)
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Security protected routes
    Route::get('/run-migrations', function (\Illuminate\Http\Request $request) {
        if (!$request->user()->isAdmin()) return response()->json(['error' => 'Unauthorized'], 403);
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        return response()->json(['message' => 'OK', 'output' => \Illuminate\Support\Facades\Artisan::output()]);
    });

    Route::get('/logs', function (\Illuminate\Http\Request $request) {
        if (!$request->user()->isAdmin()) return response()->json(['error' => 'Unauthorized'], 403);
        $path = storage_path('logs/laravel.log');
        if (!file_exists($path)) return 'No log file';
        return response(file_get_contents($path), 200)->header('Content-Type', 'text/plain');
    });

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
    Route::get('/recurring-schedules', [\App\Http\Controllers\RecurringScheduleController::class, 'index']);


    // Members
    Route::get('/members', [MemberController::class, 'index']);
    Route::get('/members/{id}', [MemberController::class, 'show']);

    // Dashboard
    Route::get('/dashboard/user', [DashboardController::class, 'userDashboard']);

    // Multas
    Route::get('/multas', [\App\Http\Controllers\MultaController::class, 'index']);
    Route::post('/multas/{id}/receipt', [\App\Http\Controllers\MultaController::class, 'uploadReceipt']);

    // Wallet (Billetera Digital)
    Route::get('/wallet', [\App\Http\Controllers\WalletController::class, 'myWallet']);
    Route::post('/wallet/recharge', [\App\Http\Controllers\WalletController::class, 'requestRecharge']);

    // Admin routes
    Route::middleware('admin')->group(function () {
        // Admin Wallets
        Route::get('/admin/wallets', [\App\Http\Controllers\WalletController::class, 'adminListAll']);
        Route::get('/admin/wallets/pending', [\App\Http\Controllers\WalletController::class, 'adminListPending']);
        Route::get('/admin/wallets/recharges', [\App\Http\Controllers\WalletController::class, 'adminRechargesHistory']);
        Route::get('/admin/wallets/{userId}/transactions', [\App\Http\Controllers\WalletController::class, 'playerTransactions']);
        Route::post('/admin/wallets/transactions/{id}/approve', [\App\Http\Controllers\WalletController::class, 'approveRecharge']);
        Route::post('/admin/wallets/transactions/{id}/reject', [\App\Http\Controllers\WalletController::class, 'rejectRecharge']);
        Route::post('/admin/wallets/{userId}/adjust', [\App\Http\Controllers\WalletController::class, 'adminAdjust']);

        Route::post('/multas/{id}/approve', [\App\Http\Controllers\MultaController::class, 'approve']);
        Route::post('/multas/{id}/reject', [\App\Http\Controllers\MultaController::class, 'reject']);
        Route::delete('/multas/{id}', [\App\Http\Controllers\MultaController::class, 'destroy']);
        
        Route::post('/confirmaciones/{id}/attendance', [\App\Http\Controllers\AttendanceController::class, 'mark']);
        Route::post('/convocatorias/{id}/attendance-batch', [\App\Http\Controllers\AttendanceController::class, 'batchMark']);
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
        Route::put('/convocatorias/{id}/confirmaciones/{userId}/role', [ConvocatoriaController::class, 'updatePlayerRole']);
        Route::put('/convocatorias/{id}/confirmaciones/{userId}/team', [ConvocatoriaController::class, 'updatePlayerTeam']);
        Route::post('/convocatorias/{id}/reset-teams', [ConvocatoriaController::class, 'resetEquipos']);
        Route::get('/admin/recurring-schedules', [\App\Http\Controllers\RecurringScheduleController::class, 'index']);
        Route::match(['put', 'patch', 'post'], '/admin/recurring-schedules/{id}', [\App\Http\Controllers\RecurringScheduleController::class, 'update']);
        Route::match(['put', 'patch', 'post'], '/recurring-schedules/{id}', [\App\Http\Controllers\RecurringScheduleController::class, 'update']);
        Route::post('/admin/convocatorias/generate-recurring', [\App\Http\Controllers\RecurringScheduleController::class, 'generate']);

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






