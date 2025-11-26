<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'api_key',
        'location',
        'serial_number',
        'device_type_id',
    ];

    // Relasi ke user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi ke sensor_data
    public function sensorData()
    {
        return $this->hasMany(SensorData::class);
    }

    // Relasi ke device_setting
    public function settings()
    {
        return $this->hasMany(DeviceSettings::class);
    }

    // Relasi ke device_type
    public function type()
    {
        return $this->belongsTo(DeviceType::class, 'device_type_id');
    }


}
