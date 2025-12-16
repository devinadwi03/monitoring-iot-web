<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cookie;
use App\Mail\OtpMail;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'=>'required|string',
            'email'=>'required|email|unique:users,email',
            'password'=> [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ]
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'name'=>$validated['name'],
                'email'=>$validated['email'],
                'password'=>Hash::make($validated['password'])
            ]);

            $token = Str::random(64);
            $user->remember_token = $token; 
            $user->save();

            $verifyUrl = env('FRONTEND_URL') . "/verify-email/{$token}?email={$user->email}";

            Mail::send('emails.verify', [
                'url' => $verifyUrl,
                'user' => $user,   // <-- tambahkan ini
            ], function ($m) use ($user) {
                $m->to($user->email)->subject('Verifikasi Email Anda');
            });

            DB::commit();

            return response()->json(['message' => 'Registrasi berhasil, email verifikasi sudah dikirim.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Registrasi gagal: '.$e->getMessage()], 500);
        }
    }

    public function verifyEmail(Request $request, $token)
    {
        $email = $request->query('email');
        $user = User::where('email', $email)->where('remember_token', $token)->first();

        if (!$user) {
            return response()->json(['message' => 'Token tidak valid atau sudah kadaluarsa'], 400);
        }

        $user->email_verified_at = Carbon::now();
        $user->remember_token = null;
        $user->save();

        return response()->json(['message' => 'Email berhasil diverifikasi']);
    }

    public function resendVerification(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email tidak ditemukan'], 404);
        }
        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email sudah diverifikasi'], 400);
        }

        $token = Str::random(64);
        $user->remember_token = $token;
        $user->save();

        $verifyUrl = env('FRONTEND_URL') . "/verify-email/{$token}?email={$user->email}";

        Mail::send('emails.verify', [
            'url' => $verifyUrl,
            'user' => $user,   // <-- tambahkan ini
        ], function ($m) use ($user) {
            $m->to($user->email)->subject('Verifikasi Email Anda');
        });

        return response()->json(['message' => 'Email verifikasi sudah dikirim ulang']);
    }
    
    // Login with Google Auth
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        // ✅ Cek verifikasi email dulu
        if (is_null($user->email_verified_at)) {
            return response()->json([
                'message' => 'Akun Anda belum diverifikasi',
            ], 403);
        }

        // Kalau user belum aktifkan Google Authenticator
        if (!$user->is_two_factor_enabled) {
            $preAuthToken = Str::random(60);
            Cache::put("preauth_{$preAuthToken}", $user->id, now()->addMinutes(5));

            $cookie = cookie(
                'pre_auth_token',
                $preAuthToken,
                5,
                null,
                null,
                config('app.env') === 'production',
                true,
                false,
                'Strict'
            );

            return response()->json([
                'message' => 'Google Authenticator belum diaktifkan',
                'next' => '/twofactor-setup',
                'require_otp' => false
            ])->cookie($cookie);
        }

        // Kalau sudah aktif → login normal (buat JWT access + refresh token)
        return response()->json([
            'message' => 'Isi OTP dari Google Authenticator',
            'require_otp' => true,
            'email' => $user->email,
        ]);
    }


     // Login with OTP Email. Step 1: verify credentials and create OTP
    public function loginWithOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        // ✅ Cek verifikasi email
        if (is_null($user->email_verified_at)) {
            return response()->json([
                'message' => 'Akun Anda belum diverifikasi',
            ], 403);
        }

        // generate OTP (6 digits)
        $otp = rand(100000, 999999);
        $otpHash = Hash::make((string)$otp);

        $otpRecord = \DB::table('user_otps')->insertGetId([
            'user_id' => $user->id,
            'otp_hash' => $otpHash,
            'purpose' => 'login',
            'expires_at' => Carbon::now()->addMinutes(5),
            'used' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Mail::to($user->email)->send(new OtpMail($user, $otp));

        $cookie = cookie(
            'otp_id',
            $otpRecord,
            5,
            null,
            null,
            config('app.env') === 'production',
            true,
            false,
            'Strict'
        );

        return response()->json(['message' => 'OTP dikirim ke email anda'])->cookie($cookie);
    }

    // Step 2: verify OTP (cookie otp_id must be present)
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'otp' => 'required|string',
            'remember' => 'boolean',
        ]);

        $otpId = $request->cookie('otp_id');
        if (!$otpId) return response()->json(['message' => 'OTP id tidak ditemukan'], 400);

        $otpRow = \DB::table('user_otps')->where('id', $otpId)->first();
        if (!$otpRow) return response()->json(['message' => 'OTP tidak ditemukan'], 400);
        if ($otpRow->used) return response()->json(['message' => 'OTP sudah dipakai'], 400);
        if (now()->gt($otpRow->expires_at)) return response()->json(['message' => 'OTP sudah kadaluarsa'], 400);
        if (!\Hash::check($request->otp, $otpRow->otp_hash)) return response()->json(['message' => 'OTP salah'], 400);

        \DB::table('user_otps')->where('id', $otpId)->update([
            'used' => true,
            'updated_at' => now(),
        ]);

        $user = User::find($otpRow->user_id);

        // generate token
        $accessToken = \App\Services\JWTService::generateAccessToken($user);
        $refreshToken = \App\Services\JWTService::generateRefreshToken($user, $request->rememberMe);

        // simpan refresh_token di tabel user_tokens
        \DB::table('user_tokens')->insert([
            'user_id' => $user->id,
            'refresh_token' => $refreshToken,
            'device' => $request->header('User-Agent'), // optional, untuk tracking device
            'expires_at' => now()->addDays($request->rememberMe ? 30 : 1),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // cookie HttpOnly
        $cookieAccess = cookie('access_token', $accessToken, 15, null, null, false, true, false, 'Strict');
        $cookieRefresh = cookie('refresh_token', $refreshToken, $request->rememberMe ? 43200 : 1440, null, null, false, true, false, 'Strict');
        $clearOtp = cookie()->forget('otp_id');

        return response()
        ->json([
            'message' => 'Login berhasil',
            'user' => $user,
        ])
        ->cookie($cookieAccess)
        ->cookie($cookieRefresh)
        ->cookie($clearOtp);
    }

    public function refreshToken(Request $request)
    {
        $refreshToken = $request->cookie('refresh_token');
        if (!$refreshToken) return response()->json(['message' => 'Refresh token tidak ada'], 401);

        try {
            $decoded = \App\Services\JWTService::verifyRefreshToken($refreshToken);
            $user = User::find($decoded->sub);

            if (!$user) {
                return response()->json(['message' => 'User tidak ditemukan'], 401);
            }

            // cek token di tabel user_tokens
            $tokenRow = \DB::table('user_tokens')
                ->where('user_id', $user->id)
                ->where('refresh_token', $refreshToken)
                ->where('expires_at', '>', now())
                ->first();

            if (!$tokenRow) {
                return response()->json(['message' => 'Refresh token invalid'], 401);
            }

            // generate access token baru
            $newAccess = \App\Services\JWTService::generateAccessToken($user);
            $cookieAccess = cookie('access_token', $newAccess, 15, null, null, false, true, false, 'Strict');

            return response()->json(['message' => 'Token refreshed'])
                            ->cookie($cookieAccess);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Refresh token expired/invalid'], 401);
        }
    }

    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        // cek OTP terakhir yang dibuat
        $lastOtp = \DB::table('user_otps')
            ->where('user_id', $user->id)
            ->where('used', false)
            ->latest('created_at')
            ->first();

        if ($lastOtp) {
            $created = \Carbon\Carbon::parse($lastOtp->created_at);
            $now = \Carbon\Carbon::now();

            // kalau belum 3 menit sejak dibuat, tolak
            if ($created->diffInSeconds($now) < 180) {
                $remaining = 180 - $created->diffInSeconds($now);
                return response()->json([
                    'message' => 'Silakan tunggu ' . gmdate("i:s", $remaining) . ' sebelum mengirim ulang OTP.',
                    'remaining' => $remaining,
                ], 429);
            }
        }

        // generate OTP baru
        $otp = rand(100000, 999999);
        $otpHash = \Hash::make((string) $otp);

        // hapus OTP lama yang belum dipakai
        \DB::table('user_otps')
            ->where('user_id', $user->id)
            ->where('used', false)
            ->delete();

        // simpan OTP baru
        $otpRecord = \DB::table('user_otps')->insertGetId([
            'user_id' => $user->id,
            'otp_hash' => $otpHash,
            'purpose' => 'login',
            'expires_at' => \Carbon\Carbon::now()->addMinutes(5),
            'used' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // kirim email OTP baru
        Mail::to($user->email)->send(new OtpMail($user, $otp));

        // set cookie otp_id baru
        $cookie = cookie(
            'otp_id',
            $otpRecord,
            300, // 5 menit
            null,
            null,
            config('app.env') === 'production',
            true,
            false,
            'Strict'
        );

        return response()
            ->json(['message' => 'Kode OTP baru sudah dikirim ke email Anda'])
            ->cookie($cookie);
    }

    public function logout(Request $request)
    {
        $userId = $request->auth_user_id;
        $refreshToken = $request->cookie('refresh_token');

        if ($userId && $refreshToken) {
            // hapus refresh token dari tabel user_tokens
            $deleted = \DB::table('user_tokens')
                ->where('user_id', $userId)
                ->where('refresh_token', $refreshToken)
                ->delete();

            \Log::info('Deleted rows: '.$deleted);
        }

        // hapus cookie access & refresh token
        $clearAccess = Cookie::forget('access_token');
        $clearRefresh = Cookie::forget('refresh_token');

        return response()->json(['message' => 'Logout berhasil'])
            ->cookie($clearAccess)
            ->cookie($clearRefresh);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // Update dan Delete pemilik akun

    public function updateAccount(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,'.$user->id,
        ]);

        $user->name = $validated['name'] ?? $user->name;
        $user->email = $validated['email'] ?? $user->email;

        $user->save();

        return response()->json([
            'message' => 'Account updated successfully',
            'user' => $user
        ]);
    }


    public function deleteAccount(Request $request)
    {
        $user = $request->user();

        // hapus semua token juga
        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => 'Account deleted successfully'
        ]);
    }

    // Validasi password lama
    public function validateOldPassword(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'oldPassword' => 'required|string',
        ]);

        if (!Hash::check($request->oldPassword, $user->password)) {
            return response()->json(['valid' => false], 200);
        }

        return response()->json(['valid' => true], 200);
    }

    // Ganti password baru
    public function changePassword(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'oldPassword' => 'required|string',
            'newPassword' => [
                'required',
                'confirmed', // pakai konfirmasi field "newPassword_confirmation"
                Password::min(8)
                    ->letters()   // harus ada huruf
                    ->mixedCase() // huruf besar & kecil
                    ->numbers()   // angka
                    ->symbols(),  // simbol
            ]
        ]);

        if (!Hash::check($request->oldPassword, $user->password)) {
            return response()->json(['message' => 'Password lama salah'], 400);
        }

        $user->password = Hash::make($request->newPassword);
        $user->save();

        return response()->json(['message' => 'Password berhasil diubah'], 200);
    }

    // Step 1: kirim email reset
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Jika email terdaftar, link reset sudah dikirim.']);
        }

        // generate token unik
        $token = Str::random(64);

        // simpan token di tabel password_resets
        \DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($token),
                'created_at' => now()
            ]
        );

        // kirim email
        $resetUrl = env('FRONTEND_URL') . "/reset-password?token=$token&email={$user->email}";
        Mail::send('emails.reset_password', ['url' => $resetUrl, 'user' => $user], function ($message) use ($user) {
            $message->to($user->email)
                    ->subject('Reset Password');
        });

        return response()->json(['message' => 'Jika email terdaftar, link reset sudah dikirim.']);
    }

    // Step 2: reset password
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()   // harus ada huruf
                    ->mixedCase() // huruf besar & kecil
                    ->numbers()   // angka
                    ->symbols(),  // simbol
            ],
        ]);

        $record = \DB::table('password_reset_tokens')->where('email', $request->email)->first();
        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json(['message' => 'Token tidak valid atau sudah kadaluarsa'], 400);
        }

        // update password
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // hapus token setelah berhasil
        \DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password berhasil diubah']);
    }

}
