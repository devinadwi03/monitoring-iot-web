<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class TwoFactorController extends Controller
{
    // Generate QR code untuk setup Google Authenticator
    public function setup(Request $request)
    {
        // Ambil user ID dari middleware
        $userId = $request->get('preauth_user_id');

        if (!$userId) {
            return response()->json([
                'message' => 'User tidak terautentikasi untuk setup 2FA.'
            ], 401);
        }

        // Ambil user dari database
        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'message' => 'User tidak ditemukan.'
            ], 404);
        }

        // Generate secret key baru untuk Google Authenticator
        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey();

        $user->google2fa_secret = $secret;
        $user->save();

        // Buat URL QR Code
        $qrCodeUrl = $google2fa->getQRCodeUrl(
            'MonitoringIoT', // Nama aplikasi kamu
            $user->email,
            $secret
        );

        // Buat QR code dalam bentuk SVG base64
        $writer = new Writer(
            new ImageRenderer(
                new RendererStyle(200),
                new SvgImageBackEnd()
            )
        );

        $qrCodeSvg = base64_encode($writer->writeString($qrCodeUrl));

        return response()->json([
            'secret' => $secret,
            'qr' => $qrCodeSvg,
            'message' => 'Scan QR di aplikasi Google Authenticator.'
        ]);
    }

    // Verifikasi kode OTP saat setup
    public function verifySetup(Request $request)
    {
        $request->validate([
            'otp' => 'required|string',
            'rememberMe' => 'boolean'
        ]);

        // Ambil user dari preauth_user_id
        $userId = $request->get('preauth_user_id');

        if (!$userId) {
            return response()->json(['message' => 'User belum terautentikasi (preauth_user_id kosong)'], 401);
        }

        $user = \App\Models\User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $google2fa = new \PragmaRX\Google2FA\Google2FA();

        if (!$google2fa->verifyKey($user->google2fa_secret, $request->otp)) {
            return response()->json(['message' => 'Kode OTP tidak valid'], 400);
        }

        $user->is_two_factor_enabled = true;
        $user->save();

        // buat JWT
        $remember = $request->boolean('rememberMe', false);
        $accessToken = \App\Services\JWTService::generateAccessToken($user);
        $refreshToken = \App\Services\JWTService::generateRefreshToken($user, $remember);

        \DB::table('user_tokens')->insert([
            'user_id' => $user->id,
            'refresh_token' => $refreshToken,
            'device' => $request->header('User-Agent'),
            'expires_at' => now()->addDays($remember ? 30 : 1),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // cookie
        $cookieAccess = cookie('access_token', $accessToken, 5, null, null, false, true, false, 'Strict');
        $cookieRefresh = cookie('refresh_token', $refreshToken, $remember ? 43200 : 1440, null, null, false, true, false, 'Strict');
        $clearPreAuth = cookie()->forget('pre_auth_token');

        return response()
            ->json([
                'message' => 'Google Authenticator berhasil diaktifkan dan login berhasil',
                'user' => $user,
                'remember' => $remember
            ])
            ->cookie($cookieAccess)
            ->cookie($cookieRefresh)
            ->cookie($clearPreAuth);
    }

    // Verifikasi OTP saat login (metode Google Auth)
    public function verifyLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string',
            'rememberMe' => 'boolean'
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        if (!$user->google2fa_secret) {
            return response()->json(['message' => 'Google Authenticator belum diaktifkan'], 400);
        }

        $google2fa = new \PragmaRX\Google2FA\Google2FA();

        if (!$google2fa->verifyKey($user->google2fa_secret, $request->otp)) {
            return response()->json(['message' => 'Kode OTP tidak valid'], 401);
        }

        // Ambil rememberMe dari request
        $rememberMe = $request->boolean('rememberMe', false);

        // Durasi token & cookie
        $refreshDays = $rememberMe ? 30 : 1;
        $accessMinutes = 5; // access_token biasanya singkat

        // ✅ Buat JWT setelah OTP sukses diverifikasi
        $accessToken = \App\Services\JWTService::generateAccessToken($user);
        $refreshToken = \App\Services\JWTService::generateRefreshToken($user, $rememberMe);

        // Simpan refresh token ke tabel user_tokens
        \DB::table('user_tokens')->insert([
            'user_id' => $user->id,
            'refresh_token' => $refreshToken,
            'device' => $request->header('User-Agent'),
            'expires_at' => now()->addDays($refreshDays),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // HttpOnly cookies
        $cookieAccess = cookie(
            'access_token',
            $accessToken,
            $accessMinutes, // 5 menit
            null,
            null,
            false, // ubah ke true kalau HTTPS
            true,  // HttpOnly
            false,
            'Strict'
        );

        $cookieRefresh = cookie(
            'refresh_token',
            $refreshToken,
            60 * 24 * $refreshDays, // menit (1 hari = 1440 menit)
            null,
            null,
            false, // ubah ke true kalau HTTPS
            true,  // HttpOnly
            false,
            'Strict'
        );

        return response()
            ->json([
                'message' => 'Login berhasil',
                'user' => $user,
                'remember' => $rememberMe
            ])
            ->cookie($cookieAccess)
            ->cookie($cookieRefresh);
    }

    // Nonaktifkan Google Auth
    public function disable(Request $request)
    {
        $user = $request->user();
        $user->google2fa_secret = null;
        $user->is_two_factor_enabled = false;
        $user->save();

        return response()->json(['message' => 'Google Authenticator dinonaktifkan.']);
    }

    public function status(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'enabled' => !empty($user->google2fa_secret),
        ]);
    }

}
