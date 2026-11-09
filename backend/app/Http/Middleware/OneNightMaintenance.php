<?php

namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Carbon;
use Laravel\\Sanctum\\PersonalAccessToken;
use Symfony\\Component\\HttpFoundation\\Response;

class OneNightMaintenance
{
    private const OWNER_PHONE = '955006789';
    private const TIMEZONE = 'America/Lima';

    public function handle(Request $request, Closure $next): Response
    {
        $now = Carbon::now(self::TIMEZONE);
        $startsAt = Carbon::create(2026, 11, 8, 22, 0, 0, self::TIMEZONE);
        $endsAt = Carbon::create(2026, 11, 9, 10, 0, 0, self::TIMEZONE);

        if (!$now->betweenIncluded($startsAt, $endsAt) || $request->is('api/maintenance-status')) {
            return $next($request);
        }

        if ($request->is('api/login')) {
            if ($this->normalizePhone((string) $request->input('phone')) === self::OWNER_PHONE) {
                return $next($request);
            }

            return $this->maintenanceResponse();
        }

        $user = $request->user();

        if (!$user && $request->bearerToken()) {
            $accessToken = PersonalAccessToken::findToken($request->bearerToken());
            $user = $accessToken?->tokenable;
        }

        if ($user && $this->normalizePhone((string) $user->phone) === self::OWNER_PHONE) {
            return $next($request);
        }

        return $this->maintenanceResponse();
    }

    private function normalizePhone(string $phone): string
    {
        return preg_replace('/\\D+/', '', $phone) ?? '';
    }

    private function maintenanceResponse(): Response
    {
        return response()->json([
            'maintenance' => true,
            'message' => 'Pichangas de Barrio está en mantenimiento programado. Volveremos mañana a las 10:00 a. m.',
            'ends_at' => '2026-11-09T10:00:00-05:00',
        ], 503);
    }
}
