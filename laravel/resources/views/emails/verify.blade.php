<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verifikasi Email</title>
</head>
<body style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; padding:20px; border-radius:8px; box-shadow:0 0 5px rgba(0,0,0,.1);">
        <h2 style="color:#333;">Halo, {{ $user->name }}</h2>
        <p>Terima kasih sudah mendaftar. Untuk mengaktifkan akun Anda, silakan verifikasi email dengan klik tombol di bawah ini:</p>
        
        <p style="text-align:center;">
            <a href="{{ $url }}" 
               style="display:inline-block; padding:12px 20px; background:#28a745; color:#fff; text-decoration:none; border-radius:5px; font-weight:bold;">
               Verifikasi Email
            </a>
        </p>

        <p>Link ini hanya berlaku sekali. Jika Anda tidak merasa membuat akun, abaikan email ini.</p>
        <hr>
        <p style="font-size:12px; color:#777;">Email ini dikirim otomatis, mohon jangan dibalas.</p>
    </div>
</body>
</html>
