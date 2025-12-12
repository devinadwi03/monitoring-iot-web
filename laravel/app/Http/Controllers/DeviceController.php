<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Device;

class DeviceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user && $user->role === 'admin') {
            return response()->json(Device::all());
        }

        return response()->json(
            Device::select('id', 'name', 'serial_number', 'location', 'device_type_id')->get()
        );
    }

    // Tambah device baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'serial_number' => 'required|string',
            'location' => 'nullable|string',
            'device_type_id' => 'required|exists:device_types,id',
        ]);

        $device = Device::create([
            'name' => $validated['name'],
            'serial_number' => $validated['serial_number'],
            'location' => $validated['location'] ?? null,
            'device_type_id' => $validated['device_type_id'],
            'api_key' => bin2hex(random_bytes(32))
        ]);

        return response()->json($device, 201);
    }

    public function show(Request $request, Device $device)
    {
        $user = $request->user();

        // Jika admin → tampilkan semua detail
        if ($user && $user->role === 'admin') {
            return response()->json($device);
        }

        // Jika bukan admin → sembunyikan data sensitif
        $filtered = $device->only(['id', 'name', 'serial_number', 'location', 'device_type_id']);

        return response()->json($filtered);
    }

    // Update device
    public function update(Request $request, Device $device)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'location' => 'sometimes|string',
            'serial_number' => 'sometimes|string',
            'device_type_id' => 'sometimes|exists:device_types,id',
        ]);

        $device->update([
            'name' => $validated['name'] ?? $device->name,
            'location' => $validated['location'] ?? $device->location,
            'serial_number' => $validated['serial_number'] ?? $device->serial_number,
            'device_type_id' => $validated['device_type_id'],

        ]);

        return response()->json($device);
    }

    // Hapus device
    public function destroy(Device $device)
    {
        $device->delete();
        return response()->json(['message' => 'Device deleted']);
    }

    public function regenerateApiKey(Device $device)
    {
        try {
            // Hasilkan API key baru yang aman
            $newApiKey = bin2hex(random_bytes(32));

            $device->api_key = $newApiKey;
            $device->save();

            return response()->json([
                'message' => 'API Key berhasil digenerate ulang.',
                'api_key' => $newApiKey,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal generate ulang API key.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
