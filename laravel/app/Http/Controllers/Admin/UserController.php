<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::all());
    }

    public function show($id)
    {
        return response()->json(User::findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
            'role' => 'required|string'
        ]);

        DB::beginTransaction();

        try {
            // Buat user baru
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role']
            ]);

            // Generate token verifikasi email
            $token = Str::random(64);
            $user->remember_token = $token;
            $user->save();

            // Buat URL verifikasi (frontend)
            $verifyUrl = env('FRONTEND_URL') . "/verify-email/{$token}?email={$user->email}";

            // Kirim email verifikasi
            Mail::send('emails.verify', [
                'url' => $verifyUrl,
                'user' => $user,
            ], function ($m) use ($user) {
                $m->to($user->email)->subject('Verifikasi Email Anda');
            });

            DB::commit();

            return response()->json([
                'message' => 'Akun berhasil dibuat dan email verifikasi telah dikirim.',
                'user' => $user,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal membuat akun: ' . $e->getMessage()
            ], 500);
        }
    }

    public function resendVerificationByAdmin($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
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
            'user' => $user,
        ], function ($m) use ($user) {
            $m->to($user->email)->subject('Verifikasi Email Anda');
        });

        return response()->json(['message' => 'Email verifikasi telah dikirim ulang ke ' . $user->email]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'=>'sometimes|string',
            'email'=>'sometimes|email|unique:users,email,'.$user->id,
            'role'=>'sometimes|string'
        ]);

        $user->update([
            'name'=>$validated['name'] ?? $user->name,
            'email'=>$validated['email'] ?? $user->email,
            'role'=>$validated['role'] ?? $user->role,
        ]);

        return response()->json($user);
    }

    public function destroy($id)
    {
        User::findOrFail($id)->delete();
        return response()->json(['message'=>'User deleted']);
    }
}
