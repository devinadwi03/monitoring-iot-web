<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceType extends Model
{
    protected $fillable = [
        'name',
        'description',
        'settings_schema',
    ];

    protected $casts = [
        'settings_schema' => 'array', // otomatis decode/encode JSON
    ];

    public function devices()
    {
        return $this->hasMany(Device::class);
    }
}
