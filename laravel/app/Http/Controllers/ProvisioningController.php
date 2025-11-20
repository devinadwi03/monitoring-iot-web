<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Device;

class ProvisioningController extends Controller
{
    public function provision(Request $request)
    {
        $validated = $request->validate([
            'device_serial' => 'required|string'
        ]);

        // Cari device berdasarkan serial number
        $device = Device::where('serial_number', $validated['device_serial'])->first();

        if (!$device) {
            return response()->json(['message' => 'Device not registered'], 404);
        }

        // Kalau device belum punya API key (belum diaktifkan admin)
        if (!$device->api_key) {
            return response()->json([
                'message' => 'Device belum diaktivasi. Hubungi admin untuk mendapatkan API key.'
            ], 403);
        }

        // Kalau sudah punya API key → kirim ke ESP32
        return response()->json([
            'device_id' => $device->id,
            'api_key' => $device->api_key
        ]);
    }

}
