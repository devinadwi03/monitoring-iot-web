<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\SensorDataController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\ProvisioningController;
use App\Http\Controllers\TwoFactorController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::get('/verify-email/{token}', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);

// OTP Email
Route::post('/login-otp', [AuthController::class, 'loginWithOtp']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/resend-otp', [AuthController::class, 'resendOtp']);

// Google auth
Route::post('/login-google', [AuthController::class, 'login']);
Route::post('/verify-google', [TwoFactorController::class, 'verifyLogin']);
//Route::get('/2fa/status', [TwoFactorController::class, 'status']);

// --- JWT Token routes ---
Route::post('/refresh-token', [AuthController::class, 'refreshToken']);

// kirim link reset password
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// reset password pake token
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('preauth')->group(function() {
    
    // Google Authentication
    Route::get('/2fa/setup', [TwoFactorController::class, 'setup']);
    Route::post('/2fa/setup/verify', [TwoFactorController::class, 'verifySetup']);
    Route::delete('/2fa/disable', [TwoFactorController::class, 'disable']);
});

// Authenticated routes (require access token)
Route::middleware('jwt')->group(function() {

    // 🔹 User account
    Route::get('/me', [AuthController::class,'me']);
    Route::put('/user', [AuthController::class, 'updateAccount']);
    Route::delete('/user', [AuthController::class, 'deleteAccount']);
    Route::post('/validate-password', [AuthController::class, 'validateOldPassword']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
   
    Route::post('/logout', [AuthController::class,'logout']);

    // 🔹 Devices CRUD
    Route::get('/devices', [DeviceController::class,'index']);
    Route::post('/devices', [DeviceController::class,'store']);
    Route::get('/devices/{device}', [DeviceController::class,'show']);
    Route::put('/devices/{device}', [DeviceController::class, 'update']);
    Route::delete('/devices/{device}', [DeviceController::class, 'destroy']);

    Route::get('/devices/{deviceId}/data', [SensorDataController::class, 'index']);

});

// Admin routes
Route::middleware(['jwt', 'isAdmin'])->group(function () {
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::get('/admin/users/{id}', [AdminUserController::class, 'show']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::put('/admin/users/{id}', [AdminUserController::class, 'update']);
    Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy']);
    Route::post('/admin/users/{id}/resend-verification', [AdminUserController::class, 'resendVerificationByAdmin']);
    Route::post('/devices/{device}/regenerate-key', [DeviceController::class, 'regenerateApiKey']);

});

// 🔹 Sensor data from ESP32 (API key)
Route::post('/sensor-data', [SensorDataController::class, 'store']);
Route::post('/provision', [ProvisioningController::class, 'provision']);
