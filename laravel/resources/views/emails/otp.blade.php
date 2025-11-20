<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Kode OTP</title>
</head>
<body style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; padding:20px; border-radius:8px; box-shadow:0 0 5px rgba(0,0,0,.1);">
        <h2 style="color:#333;">Halo, {{ $name }}</h2>
        <p>Berikut adalah kode OTP Anda untuk login:</p>

        <p style="text-align:center; font-size:24px; font-weight:bold; color:#e3342f; margin:20px 0;">
            {{ $otp }}
        </p>

        <p>Kode OTP ini berlaku selama <strong>5 menit</strong>. Jangan berikan kode ini kepada siapapun.</p>
        <hr>
        <p style="font-size:12px; color:#777;">Jika Anda tidak meminta kode OTP ini, abaikan email ini.</p>
    </div>
</body>
</html>
