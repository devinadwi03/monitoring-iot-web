<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Password</title>
</head>
<body style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; padding:20px; border-radius:8px; box-shadow:0 0 5px rgba(0,0,0,.1);">
        <h2 style="color:#333;">Halo, {{ $user->name }}</h2>
        <p>Kami menerima permintaan reset password untuk akun Anda.</p>
        <p>Silakan klik tombol di bawah ini untuk mengatur ulang password Anda:</p>
        
        <p style="text-align:center;">
            <a href="{{ $url }}" 
               style="display:inline-block; padding:12px 20px; background:#3490dc; color:#fff; text-decoration:none; border-radius:5px; font-weight:bold;">
               Reset Password
            </a>
        </p>

        <p>Link ini hanya berlaku sekali dan akan kadaluarsa dalam 60 menit.</p>
        <hr>
        <p style="font-size:12px; color:#777;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
    </div>
</body>
</html>
