<?php

namespace App\Http\Controllers;

use App\Models\DeviceType;
use Illuminate\Http\Request;

class DeviceTypeController extends Controller
{
    // GET /device-types
    public function index()
    {
        return response()->json(DeviceType::all());
    }

    // GET /device-types/{id}
    public function show($id)
    {
        $type = DeviceType::find($id);

        if (!$type) {
            return response()->json(['message' => 'Device type tidak ditemukan'], 404);
        }

        return response()->json($type);
    }

    // POST /device-types
    public function store(Request $request)
    {
        $request->validate([
            'name'            => 'required|string|max:255',
            'description'     => 'nullable|string',
            'settings_schema' => 'nullable|array', // JSON schema
        ]);

        $deviceType = DeviceType::create([
            'name'            => $request->name,
            'description'     => $request->description,
            'settings_schema' => $request->settings_schema,
        ]);

        return response()->json([
            'message' => 'Device type berhasil dibuat',
            'data'    => $deviceType,
        ], 201);
    }

    // PUT /device-types/{id}
    public function update(Request $request, $id)
    {
        $type = DeviceType::find($id);

        if (!$type) {
            return response()->json(['message' => 'Device type tidak ditemukan'], 404);
        }

        $request->validate([
            'name'            => 'sometimes|string|max:255',
            'description'     => 'nullable|string',
            'settings_schema' => 'nullable|array',
        ]);

        $type = DeviceType::findOrFail($id);
        $type->update($request->all());

        return response()->json([
            'message' => 'Device type berhasil diupdate',
            'data'    => $type,
        ]);
    }

    // DELETE /device-types/{id}
    public function destroy($id)
    {
        $type = DeviceType::find($id);

        if (!$type) {
            return response()->json(['message' => 'Device type tidak ditemukan'], 404);
        }

        $type->delete();

        return response()->json(['message' => 'Device type dihapus']);
    }
}
