<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Cache;

class VerifyPreAuthToken
{
    public function handle($request, Closure $next)
    {
        $token = $request->cookie('pre_auth_token');

        if (!$token) {
            return response()->json(['message' => 'Pre-auth token tidak ditemukan'], 401);
        }

        $userId = Cache::get("preauth_{$token}");
        if (!$userId) {
            return response()->json(['message' => 'Pre-auth token invalid atau kedaluwarsa'], 401);
        }

        // Simpan ID user sementara agar controller bisa tahu siapa dia
        $request->merge(['preauth_user_id' => $userId]);

        return $next($request);
    }
}
