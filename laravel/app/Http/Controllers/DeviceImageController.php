<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\DeviceImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use App\Services\GcsStorage;


class DeviceImageController extends Controller
{
    // Ambil semua gambar device
    public function index($device_id)
    {
        $device = Device::with('images')->findOrFail($device_id);
        $gcs = new GcsStorage();
        $images = $device->images->map(function ($img) use ($gcs) {
            return [
                'id' => $img->id,
                'device_id' => $img->device_id,
                'is_thumbnail' => $img->is_thumbnail,
                'description' => $img->description,
                'image_path' => $img->image_path,
                'image_url' => $gcs->signedUrl($img->image_path, 60),
                'created_at' => $img->created_at,
            ];
        });

        return response()->json($images);
    }

    // Ambil thumbnail device
    public function thumbnail($device_id)
    {
        $device = Device::with('thumbnail')->findOrFail($device_id);
        if (!$device->thumbnail) {
            return response()->json(null);
        }
        $gcs = new GcsStorage();

        $thumb = $device->thumbnail;

        return response()->json([
            'id' => $thumb->id,
            'image_path' => $thumb->image_path,
            'image_url' => $gcs->signedurl($thumb->image_path, 60),
        ]);
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

        $file = $request->file('image');

        // ⬇️ Force JPG output
        $filename = time() . '.jpg';
        $gcsPath = "device_images/device_{$device_id}/{$filename}";

        // ⬇️ INIT IMAGE MANAGER v3
        $manager = new ImageManager(new Driver());

        // ⬇️ READ, RESIZE, CONVERT TO JPG
        $img = $manager->read($request->file('image')->getRealPath());
        $img->scale(width: 1200);
        $jpg = $img->toJpeg(75); // COMPRESS + JPG

        // 🔥 UPLOAD TO GCS
        $gcs = new GcsStorage();
        $gcs->uploadStream($gcsPath, $jpg);


        // cek apakah device sudah punya thumbnail
        $hasThumbnail = $device->images()->where('is_thumbnail', true)->exists();

        $shouldBeThumbnail = false;

        // kalau user EXPLICIT minta jadi thumbnail
        if ($request->boolean('is_thumbnail') === true) {
            $device->images()->update(['is_thumbnail' => false]);
            $shouldBeThumbnail = true;
        }
        // kalau belum ada thumbnail sama sekali → auto set
        elseif (!$hasThumbnail) {
            $shouldBeThumbnail = true;
        }

        $image = $device->images()->create([
            'image_path' => $gcsPath,
            'is_thumbnail' => $shouldBeThumbnail,
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

            $newPath = "device_images/device_{$device->id}/{$filename}";

            // ============================
            // 🔥 UPDATED: CONVERT → JPG
            // ============================
            $img = $manager->read($request->file('image')->getRealPath());
            $img->scale(width: 1200);              // resize
            $jpg = $img->toJpeg(75);

            $gcs = new GcsStorage();

            // DELETE OLD
            $gcs->delete($image->image_path);

            // UPLOAD NEW
            $gcs->uploadStream($newPath, $jpg);

            $image->update(['image_path' => $newPath]);
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

        $gcs = new GcsStorage();
        $gcs->delete($image->image_path);

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
