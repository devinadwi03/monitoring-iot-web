<?php

  namespace App\Console\Commands;

  use Illuminate\Console\Command;
  use App\Models\UserOtp;

  class CleanupOldOTPs extends Command
  {
      protected $signature = 'otps:cleanup';
      protected $description = 'Hapus OTP yang expired lebih dari 1 hari';

      public function handle()
      {
          $deleted = UserOtp::where('expires_at', '<', now()->subDay())
                            ->delete(); // Atau ->forceDelete() jika soft delete

          $this->info("Dihapus {$deleted} record OTP lama.");
          return 0;
      }
  }