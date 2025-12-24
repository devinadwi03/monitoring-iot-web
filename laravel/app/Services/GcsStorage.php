<?php

namespace App\Services;

use Google\Cloud\Storage\StorageClient;

class GcsStorage
{
    protected $bucket;

    public function __construct()
    {
        $client = new StorageClient([
            'projectId' => config('filesystems.disks.gcs.project_id'),
            'keyFilePath' => config('filesystems.disks.gcs.key_file'),
        ]);

        $this->bucket = $client->bucket(
            config('filesystems.disks.gcs.bucket')
        );
    }

    public function uploadStream(string $path, $stream): void
    {
        $this->bucket->upload($stream, [
            'name' => $path,
            // ⛔ JANGAN visibility / predefinedAcl
        ]);
    }

    public function delete(string $path)
    {
        $object = $this->bucket->object($path);
        if ($object->exists()) {
            $object->delete();
        }
    }

    public function url(string $path): string
    {
        return 'https://storage.googleapis.com/' .
            config('filesystems.disks.gcs.bucket') . '/' .
            $path;
    }

    public function signedUrl(string $path, int $expiresInMinutes = 15): string
    {
        $object = $this->bucket->object($path);
        
        return $object->signedUrl(now()->addMinutes($expiresInMinutes));
    }

    public function deleteFolder(string $prefix)
    {
        $objects = $this->bucket->objects(['prefix' => $prefix]);
        foreach ($objects as $object) {
            $object->delete();
        }
    }

}
