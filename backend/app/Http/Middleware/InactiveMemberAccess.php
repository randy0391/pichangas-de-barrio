<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InactiveMemberAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->role !== 'member' || $user->status !== 'inactive') {
            return $next($request);
        }

        $path = $request->path();
        $method = $request->method();

        $allowed = (
            $path === 'api/user' && $method === 'GET'
        ) || (
            $path === 'api/logout' && $method === 'POST'
        ) || (
            $path === 'api/reactivation-requests' && $method === 'POST'
        ) || (
            $path === 'api/reactivation-requests/mine' && $method === 'GET'
        );

        if ($allowed) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Tu cuenta está inactiva. Solicita su reactivación para recuperar el acceso.',
            'code' => 'ACCOUNT_INACTIVE',
            'reactivation_url' => '/reactivacion',
        ], 423);
    }
}
