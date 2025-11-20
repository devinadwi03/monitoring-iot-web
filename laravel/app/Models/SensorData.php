<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SensorData extends Model
{
    use HasFactory;
    public $timestamps = false;

    protected $fillable = [
        'device_id',
        'field1',
        'field2',
        'created_at',
    ];

    // Relasi ke device
    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
