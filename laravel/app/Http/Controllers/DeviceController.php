<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Device;
use Illuminate\Support\Facades\Storage;

class DeviceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user && $user->role === 'admin') {
            return response()->json(Device::all());
        }

        return response()->json(
            Device::select('id', 'name', 'serial_number', 'location', 'description', 'device_type_id', 'created_at')->get()
        );
    }

    // Tambah device baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'serial_number' => 'required|string',
            'location' => 'nullable|string',
            'description' => 'nullable|string',
            'device_type_id' => 'required|exists:device_types,id',
        ]);

        $device = Device::create([
            'name' => $validated['name'],
            'serial_number' => $validated['serial_number'],
            'location' => $validated['location'] ?? null,
            'description' => $validated['description'] ?? null,
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
        $filtered = $device->only(['id', 'name', 'serial_number', 'location', 'description', 'device_type_id', 'created_at']);

        return response()->json($filtered);
    }

    // Update device
    public function update(Request $request, Device $device)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'location' => 'sometimes|string',
            'description' => 'sometimes|string',
            'serial_number' => 'sometimes|string',
            'device_type_id' => 'sometimes|exists:device_types,id',
        ]);

        $device->update($validated);

        return response()->json($device);
    }

    public function destroy(Device $device)
    {
        // ============================
        // 🔥 HAPUS SEMUA FILE GAMBAR
        // ============================
        $folder = 'public/device_images/device_' . $device->id;

        if (Storage::exists($folder)) {
            Storage::deleteDirectory($folder);
        }

        // ============================
        // 🔥 HAPUS DATA DATABASE
        // ============================
        // (device_images ikut terhapus kalau pakai cascade,
        // kalau belum, hapus manual)
        $device->images()->delete();

        // ============================
        // 🔥 HAPUS DEVICE
        // ============================
        $device->delete();

        return response()->json([
            'message' => 'Device dan seluruh gambar berhasil dihapus'
        ]);
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
