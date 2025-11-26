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
            return response()->json(['message' => 'Device type not found'], 404);
        }

        return response()->json($type);
    }

    // POST /device-types
    public function store(Request $request)
    {
        $request->validate([
            'type_name' => 'required|string|unique:device_types,type_name',
            'description' => 'nullable|string'
        ]);

        $type = DeviceType::create($request->all());

        return response()->json([
            'message' => 'Device type created successfully',
            'data' => $type
        ], 201);
    }

    // PUT /device-types/{id}
    public function update(Request $request, $id)
    {
        $type = DeviceType::find($id);

        if (!$type) {
            return response()->json(['message' => 'Device type not found'], 404);
        }

        $request->validate([
            'type_name' => 'required|string|unique:device_types,type_name,' . $id,
            'description' => 'nullable|string'
        ]);

        $type->update($request->all());

        return response()->json([
            'message' => 'Device type updated successfully',
            'data' => $type
        ]);
    }

    // DELETE /device-types/{id}
    public function destroy($id)
    {
        $type = DeviceType::find($id);

        if (!$type) {
            return response()->json(['message' => 'Device type not found'], 404);
        }

        $type->delete();

        return response()->json(['message' => 'Device type deleted successfully']);
    }
}
