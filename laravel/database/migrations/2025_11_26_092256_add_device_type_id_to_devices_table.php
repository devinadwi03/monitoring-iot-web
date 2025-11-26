<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_xx_xx_add_device_type_id_to_devices_table.php
    public function up(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->unsignedBigInteger('device_type_id')
                ->nullable()
                ->after('id'); // letakkan setelah ID

            $table->foreign('device_type_id')
                ->references('id')->on('device_types')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropForeign(['device_type_id']);
            $table->dropColumn('device_type_id');
        });
    }
};
