<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\DeviceImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

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
            'image' => 'required|image|max:2048',
            'is_thumbnail' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $device = Device::findOrFail($device_id);

        $folder = 'public/device_images/device_' . $device_id;
        if (!Storage::exists($folder)) {
            Storage::makeDirectory($folder);
        }

        $file = $request->file('image');
        $extension = strtolower($file->getClientOriginalExtension());

        // ⬇️ Force JPG output
        $filename = time() . '.jpg';
        $path = storage_path('app/' . $folder . '/' . $filename);

        // ⬇️ INIT IMAGE MANAGER v3
        $manager = new ImageManager(new Driver());

        // ⬇️ READ, RESIZE, CONVERT TO JPG
        $img = $manager->read($file->getRealPath());
        $img->scale(width: 1200); // maintain aspect ratio
        $img->save($path, quality: 75);

        // Reset thumbnail lama jika perlu
        if ($request->is_thumbnail) {
            $device->images()->update(['is_thumbnail' => false]);
        }

        $image = $device->images()->create([
            'image_path' => 'storage/device_images/device_' . $device_id . '/' . $filename,
            'is_thumbnail' => $request->is_thumbnail ?? false,
            'description' => $request->description,
        ]);

        return response()->json($image, 201);
    }
    public function updateFile(Request $request, $id)
    {
        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        $image = DeviceImage::findOrFail($id);
        $device = $image->device;

        // INIT manager (Wajib Intervention 3)
        $manager = new ImageManager(new Driver());

        if ($request->hasFile('image')) {

            // ============================
            // 🔥 UPDATED: FORCE JPG OUTPUT
            // ============================
            $filename = time() . '.jpg';  // <— aslinya pakai ekstensi asli, sekarang fix .jpg

            $folder = 'public/device_images/device_' . $device->id;
            if (!Storage::exists($folder)) {
                Storage::makeDirectory($folder);
            }

            $path = storage_path('app/' . $folder . '/' . $filename);

            // ============================
            // 🔥 UPDATED: CONVERT → JPG
            // ============================
            $img = $manager->read($request->file('image')->getRealPath());
            $img->scale(width: 1200);              // resize
            $img->encode('jpg', quality: 75);      // <— force convert + compress JPG
            $img->save($path);

            // ============================
            // 🔥 UPDATED: Hapus file lama
            // ============================
            $oldPath = 'public/device_images/device_' . $device->id . '/' . basename($image->image_path);
            if (Storage::exists($oldPath)) {
                Storage::delete($oldPath);
            }

            // Simpan path baru
            $image->image_path = 'storage/device_images/device_' . $device->id . '/' . $filename;
        }

        return response()->json($image);
    }

    public function setThumbnail($id)
    {
        $image = DeviceImage::findOrFail($id);

        DeviceImage::where('device_id', $image->device_id)
            ->update(['is_thumbnail' => 0]);

        $image->update(['is_thumbnail' => 1]);

        return response()->json(['success' => true]);
    }

    public function updateDescription(Request $request, $id)
    {
        $request->validate([
            'description' => 'nullable|string',
        ]);

        $image = DeviceImage::findOrFail($id);
        $image->update($request->only('description'));

        return response()->json($image);
    }

    // Hapus gambar
    public function destroy($id)
    {
        $image = DeviceImage::findOrFail($id);
        $deviceId = $image->device_id;
        $wasThumbnail = $image->is_thumbnail;

        // Hapus file fisik
        if (Storage::exists('public/device_images/device_'.$deviceId.'/'.basename($image->image_path))) {
            Storage::delete('public/device_images/device_'.$deviceId.'/'.basename($image->image_path));
        }

        $image->delete();

        // 🔥 Jika yang dihapus adalah thumbnail
        if ($wasThumbnail) {

            $newThumbnail = DeviceImage::where('device_id', $deviceId)
                ->orderBy('id')
                ->first();

            if ($newThumbnail) {
                $newThumbnail->update(['is_thumbnail' => 1]);
            }
        }

        return response()->json(['message' => 'Image deleted successfully']);
    }
}
