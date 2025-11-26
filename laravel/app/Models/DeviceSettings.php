<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceSettings extends Model
{
    use HasFactory;

    protected $table = 'device_settings';

    protected $fillable = [
        'device_id',
        'key',
        'value',
    ];

    // Relasi ke Device
    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
