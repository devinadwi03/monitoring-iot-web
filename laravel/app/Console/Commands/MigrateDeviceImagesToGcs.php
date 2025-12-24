<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\DeviceImage;
use App\Services\GcsStorage;

class MigrateDeviceImagesToGcs extends Command
{
    protected $signature = 'gcs:migrate-device-images';
    protected $description = 'Migrate device images from local public storage to GCS';

    protected GcsStorage $gcs;

    public function __construct(GcsStorage $gcs)
    {
        parent::__construct();
        $this->gcs = $gcs;
    }

    public function handle()
    {
        $this->info('Starting migration to GCS...');

        $images = DeviceImage::all();
        $count = 0;

        foreach ($images as $image) {

            // DB: /storage/device_images/xxx.jpg
            $localPath = str_replace('storage/', '', $image->image_path);

            if (!Storage::disk('public')->exists($localPath)) {
                $this->warn("NOT FOUND: {$localPath}");
                continue;
            }

            $stream = Storage::disk('public')->readStream($localPath);

            if ($stream === false) {
                $this->warn("FAILED READ: {$localPath}");
                continue;
            }

            try {
                $this->gcs->uploadStream($localPath, $stream);
                $count++;
                $this->info("Migrated: {$localPath}");
            } catch (\Throwable $e) {
                $this->error("FAILED UPLOAD: {$localPath}");
                $this->error($e->getMessage());
            } finally {
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }
        }

        $this->info("DONE. Total migrated: {$count}");
    }
}
