<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Device;
use App\Models\SensorData;

class SensorDataController extends Controller
{
    // Simpan data sensor berdasarkan API Key
    public function store(Request $request)
    {
        \Log::info('--- SensorData Request Masuk ---');
        \Log::info('Headers:', $request->headers->all());
        \Log::info('Raw Body: ' . $request->getContent());
        \Log::info('Decoded JSON:', $request->all());
        \Log::info('API Key Diterima: ' . $request->header('X-API-KEY'));

        // cari device berdasarkan API key
        $device = Device::where('api_key', $request->header('X-API-KEY'))->first();

        if (!$device) {
            \Log::error('Unauthorized API Key');
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // validasi
        try {
            $validated = $request->validate([
                'field1' => 'required|numeric',
                'field2' => 'nullable|numeric',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validasi gagal:', $e->errors());
            return response()->json(['errors' => $e->errors()], 422);
        }

        $data = SensorData::create([
            'device_id' => $device->id,
            'field1' => $validated['field1'],
            'field2' => $validated['field2'] ?? null,
            'created_at'=> now(),
        ]);

        \Log::info('Data sensor tersimpan:', $data->toArray());

        return response()->json($data, 201);
    }

    // Lihat data sensor milik 1 device
    public function index($deviceId)
    {
        $data = SensorData::where('device_id', $deviceId)->latest()->get();
        return response()->json($data);
    }
}
