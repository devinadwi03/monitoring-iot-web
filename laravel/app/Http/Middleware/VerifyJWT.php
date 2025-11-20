<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JWTService;
use Closure;
use Exception;
use Illuminate\Http\Request;

class VerifyJWT
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->cookie('access_token'); // ambil token dari cookie

        if (!$token) {
            return response()->json(['message' => 'Token tidak ditemukan'], 401);
        }

        try {
            $decoded = JWTService::verifyAccessToken($token);
            $userId = $decoded->sub ?? null;

            if (!$userId) {
                return response()->json(['message' => 'Token tidak valid'], 401);
            }

            // simpan ke request -> bisa diakses via $request->auth_user_id
            $request->merge(['auth_user_id' => $userId]);

            // juga inject user penuh -> bisa diakses via $request->user()
            $user = User::find($userId);
            if (!$user) {
                return response()->json(['message' => 'User tidak ditemukan'], 404);
            }

            // agar $request->user() tetap berfungsi
            $request->setUserResolver(fn() => $user);

        } catch (Exception $e) {
            return response()->json(['message' => 'Token tidak valid/expired'], 401);
        }

        return $next($request);
    }
}
