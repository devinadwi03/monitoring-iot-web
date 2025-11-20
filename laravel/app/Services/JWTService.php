<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Config;
use Carbon\Carbon;

class JWTService
{
    public static function generateAccessToken($user)
    {
        $payload = [
            'sub' => $user->id,
            'email' => $user->email,
            'iat' => time(),
            'exp' => time() + env('JWT_ACCESS_TTL', 300), // default 5 menit
        ];

        return JWT::encode($payload, env('JWT_ACCESS_SECRET'), 'HS256');
    }

    public static function generateRefreshToken($user, $rememberMe)
    {
        $ttl = $rememberMe ? env('JWT_REMEMBER_TTL', 2592000) : env('JWT_REFRESH_TTL', 86400);

        $payload = [
            'sub' => $user->id,
            'type' => 'refresh',
            'iat' => time(),
            'exp' => time() + $ttl,
        ];

        return JWT::encode($payload, env('JWT_REFRESH_SECRET'), 'HS256');
    }

    public static function verifyAccessToken($token)
    {
        return JWT::decode($token, new Key(env('JWT_ACCESS_SECRET'), 'HS256'));
    }

    public static function verifyRefreshToken($token)
    {
        return JWT::decode($token, new Key(env('JWT_REFRESH_SECRET'), 'HS256'));
    }
}
