<?php

namespace App\Http\Controllers;

use App\Models\DeviceSettings;
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
        $request->validate([
            'device_id' => 'required|exists:devices,id'
        ]);

        $settings = DeviceSettings::where('device_id', $request->device_id)->get();

        return response()->json([
            "success" => true,
            "data" => $settings
        ]);
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
            'value'     => 'required|string',
        ]);

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
