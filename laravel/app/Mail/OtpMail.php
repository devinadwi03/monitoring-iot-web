<?php

// app/Mail/OtpMail.php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;
    public $user;

    public function __construct($user, $otp)
    {
        $this->user = $user;
        $this->otp = $otp;
    }

    public function build()
    {
        return $this->subject('Kode OTP Login Anda')
                    ->view('emails.otp') // buat view sederhana
                    ->with([
                        'name' => $this->user->name ?? $this->user->email,
                        'otp' => $this->otp,
                    ]);
    }
}
