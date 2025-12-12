<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\DeviceImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;

class DeviceImageController extends Controller
{
    // Ambil semua gambar device
    public function index($device_id)
    {
        $device = Device::with('images')->findOrFail($device_id);
        return response()->json($device->images);
    }

    // Ambil thumbnail device
    public function thumbnail($device_id)
    {
        $device = Device::with('thumbnail')->findOrFail($device_id);
        return response()->json($device->thumbnail);
    }

    // Tambah gambar
    public function store(Request $request, $device_id)
    {
        $request->validate([
            'image' => 'required|image|max:2048', // max 2MB
            'is_thumbnail' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $device = Device::findOrFail($device_id);

        // Pastikan folder per device ada
        $folder = 'public/device_images/device_' . $device_id;
        if (!Storage::exists($folder)) {
            Storage::makeDirectory($folder);
        }

        // Handle file upload & compress
        $file = $request->file('image');
        $filename = time() . '.' . $file->getClientOriginalExtension();
        $path = storage_path('app/' . $folder . '/' . $filename);

        $img = Image::make($file->getRealPath());
        $img->resize(1200, null, function ($constraint) {
            $constraint->aspectRatio();
            $constraint->upsize();
        });
        $img->save($path, 75); // kualitas 75% => kompresi

        // Reset thumbnail lama jika diperlukan
        if ($request->is_thumbnail) {
            $device->images()->update(['is_thumbnail' => false]);
        }

        // Simpan ke database
        $image = $device->images()->create([
            'image_path' => 'storage/device_images/device_' . $device_id . '/' . $filename, // path publik
            'is_thumbnail' => $request->is_thumbnail ?? false,
            'description' => $request->description,
        ]);

        return response()->json($image, 201);
    }

    // Update gambar
    public function update(Request $request, $id)
    {
        $request->validate([
            'image' => 'sometimes|image|max:2048',
            'is_thumbnail' => 'sometimes|boolean',
            'description' => 'nullable|string',
        ]);

        $image = DeviceImage::findOrFail($id);
        $device = $image->device;

        // Upload file baru jika ada
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $folder = 'public/device_images/device_' . $device->id;
            if (!Storage::exists($folder)) {
                Storage::makeDirectory($folder);
            }

            $filename = time() . '.' . $file->getClientOriginalExtension();
            $path = storage_path('app/' . $folder . '/' . $filename);

            $img = Image::make($file->getRealPath());
            $img->resize(1200, null, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
            $img->save($path, 75);

            // Hapus file lama
            if (Storage::exists('public/device_images/device_'.$device->id.'/'.basename($image->image_path))) {
                Storage::delete('public/device_images/device_'.$device->id.'/'.basename($image->image_path));
            }

            $image->image_path = 'storage/device_images/device_' . $device->id . '/' . $filename;
        }

        // Reset thumbnail lama jika perlu
        if ($request->has('is_thumbnail') && $request->is_thumbnail) {
            $device->images()->update(['is_thumbnail' => false]);
        }

        $image->is_thumbnail = $request->is_thumbnail ?? $image->is_thumbnail;
        $image->description = $request->description ?? $image->description;

        $image->save();

        return response()->json($image);
    }

    // Hapus gambar
    public function destroy($id)
    {
        $image = DeviceImage::findOrFail($id);
        $device = $image->device;

        // Hapus file fisik
        if (Storage::exists('public/device_images/device_'.$device->id.'/'.basename($image->image_path))) {
            Storage::delete('public/device_images/device_'.$device->id.'/'.basename($image->image_path));
        }

        $image->delete();

        return response()->json(['message' => 'Image deleted successfully']);
    }
}
