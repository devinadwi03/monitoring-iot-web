<?php

namespace App\Http\Controllers;

use App\Models\DeviceSettings;
use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DeviceSettingsController extends Controller
{
    /**
     * GET /device-settings?device_id=1
     * List all settings for a device
     */
    public function index(Request $request)
    {
        $deviceId = $request->device_id;

        $device = Device::with('type')->findOrFail($deviceId);
        $schema = $device->type->settings_schema['fields'] ?? [];

        $settings = DeviceSettings::where('device_id', $deviceId)->get();

        foreach ($schema as $field) {
            $existing = $settings->firstWhere('key', $field['key']);

            if (!$existing) {
                $new = DeviceSettings::create([
                    'device_id' => $deviceId,
                    'key'       => $field['key'],
                    'value'     => $field['default'] ?? null,
                ]);

                $settings->push($new);
            }
        }

        // 🔹 Merge settings + schema for response
        $settingsMap = $settings->keyBy('key');

        $result = [];

        foreach ($schema as $field) {
            $setting = $settingsMap->get($field['key']);

            $result[] = [
                'id'       => $setting?->id,
                'key'      => $field['key'],
                'label'    => $field['label'] ?? $field['key'],
                'type'     => $field['type'] ?? 'text',
                'unit'     => $field['unit'] ?? null,
                'value'    => $setting?->value,
                'required' => $field['required'] ?? false,
            ];
        }

        return response()->json($result);
    }

    /**
     * POST /device-settings
     * Create new setting
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|exists:devices,id',
            'key'       => [
                'required',
                'string',
                Rule::unique('device_settings')->where(function ($q) use ($request) {
                    return $q->where('device_id', $request->device_id);
                })
            ],
            'value'     => 'nullable|string',
        ]);

        // Ambil device dan device type
        $device = Device::findOrFail($request->device_id);
        $deviceType = $device->type;

        if (!$deviceType) {
            return response()->json([
                'success' => false,
                'message' => 'Device type not found'
            ], 400);
        }

        // Ambil schema
        $schema = $deviceType->settings_schema;

        // Ambil default value sesuai key
        $field = collect($schema['fields'])->firstWhere('key', $request->key);

        if (!$field) {
            return response()->json([
                'success' => false,
                'message' => 'Key not found in device type schema'
            ], 400);
        }

        $validated['value'] = $request->value ?? $field['default'];

        // Simpan setting
        $setting = DeviceSettings::create($validated);


        return response()->json([
            'success' => true,
            'message' => 'Device setting created successfully',
            'data' => $setting
        ], 201);
    }

    /**
     * GET /device-settings/{id}
     * Get setting detail
     */
    public function show($id)
    {
        $setting = DeviceSettings::findOrFail($id);

        return response()->json([
            "success" => true,
            "data" => $setting
        ]);
    }

    /**
     * PUT /device-settings/{id}
     * Update key or value
     */
    public function update(Request $request, $id)
    {
        $setting = DeviceSettings::findOrFail($id);

        $validated = $request->validate([
            'key' => [
                'sometimes',
                'string',
                Rule::unique('device_settings')->where(function ($q) use ($setting) {
                    return $q->where('device_id', $setting->device_id);
                })->ignore($setting->id)
            ],
            'value' => 'sometimes|string',
        ]);

        $setting->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Device setting updated',
            'data' => $setting
        ]);
    }

    /**
     * DELETE /device-settings/{id}
     */
    public function destroy($id)
    {
        $setting = DeviceSettings::findOrFail($id);
        $setting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Deleted successfully'
        ]);
    }
}
